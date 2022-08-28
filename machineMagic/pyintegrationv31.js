const { relative } = require('path');
var path = require('path');

function promiseMaker(imgPath) {
    
    return runPy = new Promise(function(success, nosuccess) {

        const { spawn } = require('child_process');
    
        try{

            //Get the relative directories of files used by angelModel3.py
            console.log("Pomisemaker directory:", __dirname);
            var relativeImgPath = path.join(__dirname, imgPath);
            console.log("Relative img path:", relativeImgPath);
            var relativePyPath = path.join(__dirname, './angelModel3.py');
            console.log("Relative py path:", relativePyPath);
            var relativeJsonPath = path.join(__dirname, './banana_model.json');
            console.log("Relative py path:", relativeJsonPath);
            var relativeh5Path = path.join(__dirname, './banana_weights.h5');
            console.log("Relative py path:", relativeh5Path);


            const pyprog = spawn('python', [relativePyPath, relativeImgPath, relativeJsonPath, relativeh5Path]);

            var scriptOutput = "";
    
            pyprog.stdout.on('data', function(data) {
                console.log('stdout: ' + data);
                data=data.toString();
                scriptOutput+=data;
            });

            pyprog.on('close', function(code) {
                //Here you can get the exit code of the script
            
                console.log('closing code: ' + code);
            
                console.log('Full output of script: ',scriptOutput);
                success(scriptOutput);
            });
        } catch(error) {
            console.log(error);
        }
        
    });
}

/*
let runPy = new Promise(function(success, nosuccess) {

    const { spawn } = require('child_process');

    try{
        const pyprog = spawn('python', ['./angelModel3.py', './testjpgs/banana.jpg']);

        var scriptOutput = "";

        pyprog.stdout.on('data', function(data) {
            console.log('stdout: ' + data);
            data=data.toString();
            scriptOutput+=data;
        });

        pyprog.on('close', function(code) {
            //Here you can get the exit code of the script
        
            console.log('closing code: ' + code);
        
            console.log('Full output of script: ',scriptOutput);
            success(scriptOutput);
        });
    } catch(error) {
        console.log(error);
    }
    
});
*/


async function imageClassification(imgPath) {
    try{
        console.log("imageClass directory:", __dirname);
        console.log("imageClass imgPath:" + imgPath);
        console.log("imgPath:", imgPath);
        await promiseMaker(imgPath).then(function(fromRunpy) {
            //console.log("from runpy:");
            //console.log(fromRunpy.toString());
            stringified = fromRunpy.toString()
            spliceStart = stringified.lastIndexOf("RR: ") + 4;
            console.log(spliceStart);
            spliceEnd = stringified.lastIndexOf(":RR");
            console.log(spliceEnd);
            ripenessVal = stringified.slice(spliceStart, spliceEnd);
            console.log("ripeness val:" + ripenessVal);
        });
    } catch(error) {
        console.log(error);
        return "PREDICTION ERROR";
    }
    return ripenessVal;
}

module.exports = {imageClassification}