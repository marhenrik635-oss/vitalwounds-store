import { readFileSync, createReadStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SSH = {
  host: '208.76.40.197',
  port: 15161,
  username: 'ubuntu',
  password: 'jati@VPS',
};

const DIST = join(__dirname, 'dist');
const REMOTE_BASE = '/home/ubuntu/vitalwounds';

async function main() {
  // Build fresh
  console.log('=== Building... ===');
  execSync('npx vite build', { cwd: __dirname, stdio: 'pipe', timeout: 60000 });
  console.log('Build OK');

  // Create tar.gz of dist
  console.log('\n=== Creating tar.gz of dist/ ===');
  // Use external tar command
  execSync(`tar -czf _deploy.tar.gz -C "${DIST}" .`, { cwd: __dirname, stdio: 'pipe' });
  const tarSize = readFileSync(join(__dirname, '_deploy.tar.gz')).length;
  console.log(`Tar.gz size: ${(tarSize / 1024 / 1024).toFixed(2)} MB`);

  // Dynamic import ssh2 (CJS module)
  console.log('\n=== Connecting to VPS via SSH ===');
  const { Client } = await import('ssh2');
  
  const conn = new Client();
  
  await new Promise((resolve, reject) => {
    conn.on('ready', async () => {
      console.log('✅ SSH Connected!');
      
      try {
        // Upload via SFTP
        console.log('Uploading via SFTP...');
        conn.sftp(async (err, sftp) => {
          if (err) { console.error('SFTP Error:', err); reject(err); return; }
          
          // Upload the tar.gz file
          const localFile = join(__dirname, '_deploy.tar.gz');
          const remoteFile = `${REMOTE_BASE}/_deploy.tar.gz`;
          
          console.log(`  Uploading _deploy.tar.gz (${(tarSize/1024/1024).toFixed(2)} MB)...`);
          const readStream = createReadStream(localFile);
          const writeStream = sftp.createWriteStream(remoteFile);
          
          writeStream.on('close', () => {
            console.log('  Upload complete!');
            
            // Extract and restart
            console.log('\n=== Extracting & Restarting ===');
            conn.exec(
              `cd ${REMOTE_BASE} && ` +
              `tar -xzf _deploy.tar.gz -C dist/ && ` +
              `rm _deploy.tar.gz && ` +
              `pkill -f "node.*server.js" 2>/dev/null; sleep 1; ` +
              `nohup node server.js > ~/server.log 2>&1 & ` +
              `sleep 2 && ` +
              `ps aux | grep "node.*server.js" | grep -v grep || echo "NOT_RUNNING"`,
              (err2, stream) => {
                if (err2) { console.error('Exec error:', err2); reject(err2); return; }
                let output = '';
                stream.on('data', (d) => { output += d.toString(); });
                stream.stderr.on('data', (d) => { if (d.toString().trim()) console.log('  stderr:', d.toString().trim()); });
                stream.on('close', (code) => {
                  console.log('Deploy output:', output);
                  if (output.includes('NOT_RUNNING')) {
                    console.log('⚠️ Server may not be running, trying alternate start...');
                    conn.exec(
                      `cd ${REMOTE_BASE} && nohup node server.js > ~/server.log 2>&1 &`,
                      () => { conn.end(); resolve(); }
                    );
                  } else {
                    console.log('✅ Server restarted successfully!');
                    conn.end();
                    resolve();
                  }
                });
              }
            );
          });
          
          writeStream.on('error', (err) => { console.error('Write error:', err); reject(err); });
          readStream.pipe(writeStream);
        });
      } catch (e) {
        reject(e);
      }
    });
    
    conn.on('error', (err) => {
      console.error('SSH connection error:', err.message);
      reject(err);
    });
    
    conn.connect(SSH);
  });
  
  // Cleanup
  execSync(`rm -f "${join(__dirname, '_deploy.tar.gz')}"`, { stdio: 'pipe' });
  console.log('\n✅ Deployment complete!');
}

main().catch(e => {
  console.error('Deployment failed:', e.message);
  process.exit(1);
});
