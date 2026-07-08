
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('208.76.40.197', port=15161, username='ubuntu', password='jati@VPS', timeout=30)

stdin, stdout, stderr = ssh.exec_command("cat ~/vitalwounds/src/App.tsx | grep -n 'WaveBg'")
out = stdout.read().decode().strip()
print("App.tsx WaveBg import lines:")
print(out)

stdin, stdout, stderr = ssh.exec_command("ls -la ~/vitalwounds/src/components/ | grep WaveBg")
out = stdout.read().decode().strip()
print("\nWaveBg.tsx file:")
print(out)

stdin, stdout, stderr = ssh.exec_command("head -5 ~/vitalwounds/src/components/WaveBg.tsx")
out = stdout.read().decode().strip()
print("\nFirst few lines of WaveBg.tsx:")
print(out)

ssh.close()
