
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('208.76.40.197', port=15161, username='ubuntu', password='jati@VPS', timeout=30)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out[:2000])
    if err: print(f"ERR: {err[:500]}")

print("=== Nginx sites-enabled ===")
run("cat /etc/nginx/sites-enabled/default 2>/dev/null || cat /etc/nginx/conf.d/default.conf 2>/dev/null || ls /etc/nginx/sites-enabled/ 2>/dev/null || echo 'not found'")

print("\n=== Nginx vite config ===")
run("grep -r 'vitalwounds' /etc/nginx/ 2>/dev/null | head -20")

print("\n=== current dist size ===")
run("ls -la ~/vitalwounds/dist/ | head -20")
run("du -sh ~/vitalwounds/dist/")

ssh.close()
