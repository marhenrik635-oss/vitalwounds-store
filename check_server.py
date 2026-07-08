
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('208.76.40.197', port=15161, username='ubuntu', password='jati@VPS', timeout=30)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out[:3000])
    if err: print(f"ERR: {err[:500]}")

print("=== server.js (FE server) ===")
run("cat ~/vitalwounds/server.js")

print("\n=== Nginx default server block ===")
run("cat /etc/nginx/sites-enabled/default | grep -A 20 'server {'")
run("cat /etc/nginx/nginx.conf 2>/dev/null | head -30")

ssh.close()
