const { MSICreator } = require('electron-wix-msi');
const path = require('path');

const msiCreator = new MSICreator({
    appDirectory: path.resolve(__dirname, '../release-builds/NPVCalculator-win32-x64'),
    outputDirectory: path.resolve(__dirname, '../windows_installer'),
    description: 'NPV Calculator Desktop App',
    exe: 'NPVCalculator',
    name: 'NPV Calculator',
    manufacturer: 'Assassxn',
    version: '1.0.0',
    ui: { chooseDirectory: true },
    icon: "assets/images/calculator.ico",
});
// Create a .wxs template file and compile it to .msi
msiCreator.create().then(() => msiCreator.compile());