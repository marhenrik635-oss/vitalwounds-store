
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('208.76.40.197', port=15161, username='ubuntu', password='jati@VPS', timeout=30)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out[:2000])
    if err: print(f"ERR: {err[:400]}")

print("=== Cek index.html di dist VPS ===")
run("grep -c 'WaveBg' ~/vitalwounds/dist/assets/index-*.js 2>/dev/null || echo 'WaveBg NOT found in JS files'")

print("\n=== Nama file index JS baru ===")
run("ls -la ~/vitalwounds/dist/assets/index-*.js")

print("\n=== Isi dir dist ===")
run("ls -la ~/vitalwounds/dist/")
run("ls ~/vitalwounds/dist/assets/ | head -20")

print("\n=== Cek apakah WaveBg ada di output bundle ===")
run("grep -r 'WaveBg' ~/vitalwounds/dist/ 2>/dev/null | head -5")

print("\n=== Cek index.html main content ===")
run("head -30 ~/vitalwounds/dist/index.html")

ssh.close()
