
import paramiko, time, json

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('208.76.40.197', port=15161, username='ubuntu', password='jati@VPS', timeout=30)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if err: print(f"ERR: {err[:400]}")
    return out

# Cek struktur VPS — dimana FE diserve
print("=== PM2 list ===")
print(run("pm2 delete camofox 2>/dev/null || true"))
print(run("pm2 list"))

print("\n=== Cek FE dir ===")
print(run("ls -la /home/ubuntu/vitalwounds-backend/ 2>/dev/null || echo 'no backend dir'"))
print(run("ls -la /home/ubuntu/vitalwounds/ 2>/dev/null || echo 'no FE dir'"))
print(run("ls -la /var/www/vitalwounds/ 2>/dev/null || echo 'no /var/www dir'"))

# Cek port mana yang serve web
print("\n=== Port check ===")
print(run("ss -tlnp | grep -E ':(80|443|3000|5173|5000)' 2>/dev/null || netstat -tlnp 2>/dev/null | grep -E ':(80|443|3000|5173|5000)' || echo 'no ports found'"))

# Cek nginx
print("\n=== Nginx check ===")
print(run("nginx -t 2>&1 || echo 'no nginx'"))

ssh.close()
