const { publicDecrypt } = require('crypto');
const express = require('express')
const app = express()

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

app.get('/', async (req, res) => {

    res.write('welcome\n');

    try{
        await runPy.then(function(fromRunpy) {
            console.log("from runpy:");
            console.log(fromRunpy.toString());
            stringified = fromRunpy.toString()
            spliceStart = stringified.lastIndexOf("RR: ") + 4;
            console.log(spliceStart);
            spliceEnd = stringified.lastIndexOf(":RR");
            console.log(spliceEnd);
            ripenessVal = stringified.slice(spliceStart, spliceEnd);
            console.log(ripenessVal);
            res.end(ripenessVal);
        });
    } catch(error) {
        console.log(error);
    }
    
})

app.listen(3000, () => console.log('Application listening on port 3000!'))