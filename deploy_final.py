
import paramiko, os

# SSH connection
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('208.76.40.197', port=15161, username='ubuntu', password='jati@VPS', timeout=30)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode().strip(), stderr.read().decode().strip()

print("=== 1. Cleaning old dist ===")
run("rm -rf ~/vitalwounds/dist/*")

# Upload files from local dist to VPS dist
# Since paramiko SFTP is best for this:
sftp = ssh.open_sftp()

# Local path to dist
local_dist = 'C:/Users/Administrator/Documents/vitalwounds/dist'
remote_dist = '/home/ubuntu/vitalwounds/dist'

for root, dirs, files in os.walk(local_dist):
    # Create remote directories
    rel_path = os.path.relpath(root, local_dist)
    if rel_path != '.':
        remote_dir = os.path.join(remote_dist, rel_path).replace('\\', '/')
        try:
            ssh.exec_command(f"mkdir -p {remote_dir}")
        except: pass

    # Upload files
    for file in files:
        local_file = os.path.join(root, file)
        remote_file = os.path.join(remote_dist, rel_path, file).replace('\\', '/') if rel_path != '.' else os.path.join(remote_dist, file).replace('\\', '/')
        sftp.put(local_file, remote_file)

sftp.close()
print("Upload complete.")

print("\n=== 2. Restarting server ===")
# Find pid of server.js
pid_out, _ = run("pgrep -f 'node /home/ubuntu/vitalwounds/server.js'")
if pid_out:
    print(f"Killing process {pid_out}")
    run(f"kill -9 {pid_out}")

# Restart with nohup
run("nohup node /home/ubuntu/vitalwounds/server.js > ~/server.log 2>&1 &")
print("Server restarted with nohup.")

print("\n=== 3. Verifying process ===")
verify, _ = run("ps aux | grep 'node /home/ubuntu/vitalwounds/server.js' | grep -v grep")
print(verify)

ssh.close()
