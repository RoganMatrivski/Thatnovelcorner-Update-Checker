if which node > /dev/null
then
    echo 'Installing Node Modules...'

    npm install --production
else
    echo 'Node is not installed! You can download the Node-bundled version on the release page.\nAborting...'
fi