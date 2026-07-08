
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('208.76.40.197', port=15161, username='ubuntu', password='jati@VPS', timeout=30)

stdin, stdout, stderr = ssh.exec_command("grep -c 'WaveBg' ~/vitalwounds/dist/assets/index-Cd6x4GDo.js")
out = stdout.read().decode().strip()
print(f"WaveBg references in bundle: {out}")

stdin, stdout, stderr = ssh.exec_command("ls -la ~/vitalwounds/dist/assets/index-*.js")
out = stdout.read().decode().strip()
print(f"Index JS file: {out}")

stdin, stdout, stderr = ssh.exec_command("grep -c 'canvasRef' ~/vitalwounds/dist/assets/index-Cd6x4GDo.js")
out = stdout.read().decode().strip()
print(f"canvasRef in bundle: {out}")

ssh.close()
