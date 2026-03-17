const { NodeSSH } = require('node-ssh');
const path = require('path');
const fs = require('fs');

const ssh = new NodeSSH();

const config = {
  host: '82.25.125.224',
  username: 'u678926284',
  password: 'Purbia@!2026@!',
  port: 65002,
  tryKeyboard: true,
};

const localDir = path.join(__dirname, 'dist');
const remoteDir = '/home/u678926284/domains/purbiaenterprise.com/public_html/auth/public';

async function deploy() {
  console.log('Connecting to Hostinger via SSH...');
  try {
    await ssh.connect(config);
    console.log('Connected!');

    console.log(`Uploading contents of ${localDir} to ${remoteDir}...`);
    
    // Copy the dist directory contents
    await ssh.putDirectory(localDir, remoteDir, {
      recursive: true,
      concurrency: 10,
      tick: (localPath, remotePath, error) => {
        if (error) {
          console.error(`Failed to upload ${localPath}: ${error.message}`);
        }
      }
    });

    console.log('Upload complete, file permissions fix next...');
    
    // Run post-deploy commands
    await ssh.execCommand(`find ${remoteDir} -type d -exec chmod 755 {} \\;`);
    await ssh.execCommand(`find ${remoteDir} -type f -exec chmod 644 {} \\;`);
    await ssh.execCommand(`sed -i 's|href="/assets/|href="./assets/|g' ${remoteDir}/index.html`);
    await ssh.execCommand(`sed -i 's|src="/assets/|src="./assets/|g' ${remoteDir}/index.html`);
    
    console.log('Deployment completely finished successfully!');
  } catch (err) {
    console.error('Deployment Failed:', err);
  } finally {
    ssh.dispose();
  }
}

deploy();
