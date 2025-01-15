const fs = require('fs');

const saveToFile = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, data, { encoding: 'utf8' });
        console.log('Data successfully saved to file.');
    } catch (error) {
        console.error('Error saving to file:', error.message);
    }
};

const readFromFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, { encoding: 'utf8' });
        } else {
            console.warn('File does not exist.');
            return null;
        }
    } catch (error) {
        console.error('Error reading from file:', error.message);
        return null;
    }
};

module.exports = {
    saveToFile,
    readFromFile,
};
