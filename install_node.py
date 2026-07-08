import sys

# Force output stream encoding to utf-8 to prevent cp1252/cp850 errors
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect('208.76.40.197', port=15161, username='ubuntu', password='jati@VPS', timeout=30)
    print("SSH connected.")

    def run(cmd):
        # We need to manually source nvm and use node explicitly
        full_cmd = f'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && {cmd}'
        print(f"Exec: {full_cmd}")
        stdin, stdout, stderr = ssh.exec_command(full_cmd)
        exit_status = stdout.channel.recv_exit_status()
        out = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        if out: print(f"OUT: {out.encode('utf-8', 'ignore').decode('utf-8')}")
        if err: print(f"ERR: {err.encode('utf-8', 'ignore').decode('utf-8')}")
        return exit_status, out, err

    # Verify node version
    run("node -v")

    # Install pm2
    run("npm install -g pm2")

    # Build and start
    run("cd /home/ubuntu/vitalwounds && npm install && npm run build")
    run("pm2 delete vitalwounds || true")
    run("cd /home/ubuntu/vitalwounds && pm2 start npm --name vitalwounds -- run start")
    run("pm2 save")

finally:
    ssh.close()
