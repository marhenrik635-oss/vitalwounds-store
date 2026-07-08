
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

# Cek isi dist public (logos, images etc)
print("=== Isi assets dist VPS ===")
run("ls ~/vitalwounds/dist/assets/ | head -10")

print("\n=== Cek index.html yang disajikan ===")
run("cat /var/www/html/index.html 2>/dev/null || echo 'tidak ada di /var/www/html/'")
run("ls -la /var/www/html/ 2>/dev/null || echo 'folder kosong /var/www/html'")

# Cek dari mana nginx serve vitalwounds.my.id - possible server block
print("\n=== Server blocks vitalwounds ===")
run("grep -rl 'vitalwounds' /etc/nginx/ 2>/dev/null || echo 'no vitalwounds ref in nginx'")

# Cek proses node
print("\n=== Node processes ===")
run("ps aux | grep node | grep -v grep")

ssh.close()
