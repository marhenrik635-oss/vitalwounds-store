import paramiko
import sys

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    print("Connecting...")
    ssh.connect('208.76.40.197', port=15161, username='ubuntu', password='jati@VPS', timeout=10)
    print("Connected successfully!")
    stdin, stdout, stderr = ssh.exec_command('uname -a')
    print("Output:", stdout.read().decode())
    print("Error:", stderr.read().decode())
except Exception as e:
    print("Failed:", e)
finally:
    ssh.close()
