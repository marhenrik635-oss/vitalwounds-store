
import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect('208.76.40.197', port=15161, username='ubuntu', password='jati@VPS', timeout=30)
    print("SSH connection established.")

    def run_remote_command(cmd, sudo=False):
        if sudo:
            # Using -S to read password from stdin
            cmd = f"echo 'jati@VPS' | sudo -S {cmd}"
        print(f"\nExecuting: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode().strip()
        error = stderr.read().decode().strip()
        if output:
            print(f"STDOUT:\n{output}")
        if error:
            print(f"STDERR:\n{error}")
        return exit_status, output, error

    # Upgrade Node.js to 18.x
    print("Attempting to upgrade Node.js to 18.x...")

    # Stop any running Node.js processes related to the application
    run_remote_command("pm2 stop vitalwounds || true")
    run_remote_command("killall node || true")

    # Remove existing Node.js if present
    run_remote_command("apt-get update", sudo=True)
    run_remote_command("apt-get purge -y nodejs", sudo=True)
    run_remote_command("rm -rf /etc/apt/sources.list.d/nodesource.list", sudo=True)
    run_remote_command("rm -rf /usr/bin/node /usr/bin/npm /usr/bin/npx", sudo=True)

    # Clear apt locks if they exist
    run_remote_command("rm -f /var/lib/apt/lists/lock", sudo=True)
    run_remote_command("rm -f /var/cache/apt/pkgcache.bin", sudo=True)

    # Add NodeSource APT repository for Node.js 18.x
    run_remote_command("curl -fsSL https://deb.nodesource.com/setup_18.x | echo 'jati@VPS' | sudo -S bash -", sudo=False)

    # Install Node.js 18.x
    run_remote_command("apt-get install -y nodejs", sudo=True)

    # Install 'n' for Node.js version management if not already installed
    status, output, error = run_remote_command("npm install -g n")
    if status != 0:
        print("npm install -g n failed, attempting to install npm first...")
        run_remote_command("apt-get install -y npm", sudo=True)
        run_remote_command("npm install -g n")

    # Use 'n' to install Node.js 18.x
    run_remote_command("n 18", sudo=True)

    # Set Node.js 18 as default
    run_remote_command("ln -sf /usr/local/n/versions/node/18.*/bin/node /usr/bin/node", sudo=True)
    run_remote_command("ln -sf /usr/local/n/versions/node/18.*/bin/npm /usr/bin/npm", sudo=True)
    run_remote_command("ln -sf /usr/local/n/versions/node/18.*/bin/npx /usr/bin/npx", sudo=True)


    # Verify Node.js version
    status, output, error = run_remote_command("node -v")
    if status == 0 and "v18" in output:
        print(f"Node.js successfully upgraded to {output}")
    else:
        print(f"Node.js upgrade failed or unexpected version: {output}. Error: {error}")
        exit(1)

    status, output, error = run_remote_command("npm -v")
    if status == 0:
        print(f"npm version: {output}")
    else:
        print(f"npm version check failed: {output}. Error: {error}")
        exit(1)
        
    print("\nNode.js upgrade process completed.")

except Exception as e:
    print(f"An error occurred: {e}")
finally:
    ssh.close()
    print("SSH connection closed.")
