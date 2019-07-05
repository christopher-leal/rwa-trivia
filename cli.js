const execSync = require('child_process').execSync;
const yargs = require('yargs');
const projects = ["trivia", "bitwiser-edu", "trivia-admin", "trivia-editor"];
const configProject = ["trivia", "bitwiser-edu"];
const env = ['dev', 'staging', 'production'];
const packageNames = ["io.bitwiser.trivia", "io.bitwiser.trivia.dev", "io.bitwiser.edu.dev"];
const firebaseProject = [ "trivia-dev",
    "trivia-staging",
    "trivia-production",
    "bitwiser-edu-dev",
    "bitwiser-edu-staging",
    "bitwiser-edu-production"
];

let argv;
let executableCmd = '';

const commandList = {
    "start": 
        {   "command" : `ng serve projectName --configuration=configProject-environment`,
            "description" : "start web/admin/editor app",
            "options" : { 
                        "projectName" : { 
                            "demand" : true,
                            "description": 'project Name e.g. trivia',
                            "type": 'string',
                            "choices":  projects
                        },
                        "configProject" : { 
                            "demand" : true,
                            "description": 'configuration project name defined in angular.json e.g. trivia',
                            "type": 'string',
                            "choices":  configProject
                        },
                        "environment" : { 
                            "demand" : true,
                            "description": 'environment',
                            "type": 'string',
                            "choices":  env
                        }
            }
    },
    "deploy-functions-local":  
        {   "command" : "npx rimraf functions/server & tsc --project functions  && firebase serve -P projectName  --only functions",
            "description" : "deploy firebase functions local",
            "options" : { 
                "projectName" : { 
                    "demand" : true,
                    "description": 'configuration project name defined in angular.json e.g. trivia',
                    "type": 'string',
                    "choices":  firebaseProject
                }
            }
        },
        "deploy-functions":
        {      
            "command" : "ng build trivia  --configuration=configProject-staging && ng build trivia-admin  --configuration=configProject-staging && ng build trivia-editor --configuration=configProject-staging && ng run trivia:server && npx rimraf functions/server       && tsc --project functions && npm install firebase@5.2.0 && npx webpack --config webpack.server.config.js && npx cpx dist/index.html functions/dist && npx rimraf dist/index.html                                                                                                         && npx rimraf functions/index.js &&  cp functions/app-functions.js functions/index.js && firebase deploy -P projectName   --only functions && npx rimraf functions/index.js && cp functions/ssr-functions.js functions/index.js && firebase deploy -P projectName          --only functions:ssr && firebase deploy -P projectName  --only hosting && npm install firebase@6.0.2",             
              "description" : "deploy firebase functions to staging env",
              "options" : { 
                "projectName" : { 
                    "demand" : true,
                    "description": 'project Name from .firebaserc e.g. trivia-staging',
                    "type": 'string',
                    "choices":  firebaseProject
                },
                "configProject" : { 
                    "demand" : true,
                    "description": 'configuration project name defined in angular.json e.g. trivia',
                    "type": 'string',
                    "choices":  configProject
                }
            }
        },
        "prod:deploy-functions":
        {
            "command" :  "ng build trivia  --configuration=configProject-production && ng build trivia-admin  --configuration=configProject-production && ng build trivia-editor --configuration=configProject-production && ng run trivia:server && npx rimraf functions/server          && tsc --project functions && npm install firebase@5.2.0 && npx webpack --config webpack.server.config.js && npx cpx dist/index.html functions/dist && npx rimraf dist/index.html && npm run firebase -P projectName functions:config:set environment.production=true && npx rimraf functions/index.js &&  cp functions/app-functions.js functions/index.js && firebase deploy -P projectName                --only functions && npx rimraf functions/index.js && cp functions/ssr-functions.js functions/index.js && firebase deploy -P projectName --only functions:ssr && firebase deploy -P projectName  --only hosting && npm install firebase@6.0.2",
            "description" : "deploy firebase functions to production",
            "options" : { 
                "projectName" : { 
                    "demand" : true,
                    "description": 'project Name from .firebaserc e.g. trivia-staging',
                    "type": 'string',
                    "choices":  firebaseProject
                },
                "configProject" : { 
                    "demand" : true,
                    "description": 'configuration project name defined in angular.json e.g. trivia',
                    "type": 'string',
                    "choices":  configProject
                }
            }
        },
        "dev-android":
        {
            "command" : "tns run android --bundle --env.package_name=packageName --env.project=projectName",
            "description" : "run android app in dev environment",
            "options" : { 
                "projectName" : { 
                    "demand" : true,
                    "description": 'project Name e.g. trivia',
                    "type": 'string',
                    "choices":  projects
                },
                "packageName" : { 
                    "demand" : true,
                    "description": 'project package name defined in firebase e.g. io.bitwiser.trivia.dev',
                    "type": 'string',
                    "choices":  packageNames
                }
            }
        },
        "prod-android": {
            "command" : "tns run android --bundle --env.prod --env.aot --env.uglify --env.package_name=packageName --env.project=projectName",
            "description" :  "run android app in production environment",
            "options" : { 
                "projectName" : { 
                    "demand" : true,
                    "description": 'project Name e.g. trivia',
                    "type": 'string',
                    "choices":  projects
                },
                "packageName" : { 
                    "demand" : true,
                    "description": 'project package name defined in firebase e.g. io.bitwiser.trivia.dev',
                    "type": 'string',
                    "choices":  packageNames
                }
            }
        },
        "release-dev-android": {
            "command" : "sh release/projectName/dev-android.sh",
            "description" :  "release android app for staging environment",
            "options" : { 
                "projectName" : { 
                    "demand" : true,
                    "description": 'project Name e.g. trivia',
                    "type": 'string',
                    "choices":  projects
                }
            }
        },
        "release-prod-android": {
            "command" : "sh release/projectName/prod-android.sh",
            "description" : "release android app in production environment",
            "options" : { 
                "projectName" : { 
                    "demand" : true,
                    "description": 'project Name e.g. trivia',
                    "type": 'string',
                    "choices":  projects
                }
            }
        },
        "dev-ios": {
            "command" : "tns run ios --bundle  --env.package_name=packageName --env.project=projectName",
            "description" : "run ios app in staging environment",
            "options" : { 
                "projectName" : { 
                    "demand" : true,
                    "description": 'project Name e.g. trivia',
                    "type": 'string',
                    "choices":  projects
                },
                "packageName" : { 
                    "demand" : true,
                    "description": 'project package name defined in firebase e.g. io.bitwiser.trivia.dev',
                    "type": 'string',
                    "choices":  packageNames
                }
            }
        },
        "prod-ios": {
            "command" : "tns run ios --bundle --env.prod --env.aot --env.uglify --for-device --env.package_name=packageName --env.project=projectName",
            "description" : "run ios app in production environment",
            "options" : { 
                "projectName" : { 
                    "demand" : true,
                    "description": 'project Name e.g. trivia',
                    "type": 'string',
                    "choices":  projects
                },
                "packageName" : { 
                    "demand" : true,
                    "description": 'project package name defined in firebase e.g. io.bitwiser.trivia.dev',
                    "type": 'string',
                    "choices":  packageNames
                }
            }
        },
        "release-dev-ios": {
            "command" : "rm -rf platforms/ios && tns prepare ios --bundle --release  --env.aot --env.uglify --for-device --env.package_name=packageName  --env.project=projectName",
            "description" : "release ios app in staging environment",
            "options" : { 
                "projectName" : { 
                    "demand" : true,
                    "description": 'project Name e.g. trivia',
                    "type": 'string',
                    "choices":  projects
                },
                "packageName" : { 
                    "demand" : true,
                    "description": 'project package name defined in firebase e.g. io.bitwiser.trivia.dev',
                    "type": 'string',
                    "choices":  packageNames
                }
            }
        },
        "release-prod-ios": {
            "command" : "rm -rf platforms/ios && tns prepare ios --bundle --release --env.prod --env.aot --env.uglify --for-device --env.package_name=packageName  --env.project=projectName",
            "description" : "release ios app in production environment",
            "options" : { 
                "projectName" : { 
                    "demand" : true,
                    "description": 'project Name e.g. trivia',
                    "type": 'string',
                    "choices":  projects
                },
                "packageName" : { 
                    "demand" : true,
                    "description": 'project package name defined in firebase e.g. io.bitwiser.trivia.dev',
                    "type": 'string',
                    "choices":  packageNames
                }
            }
        },
        "run-schedular": {
            "command" : "npx rimraf functions/server  & tsc --project scheduler && node scheduler/server/run-scheduler.js environment",
            "description" : "run schedular for given environment",
            "options" : { 
                "environment" : { 
                    "demand" : true,
                    "description": 'environment',
                    "type": 'string',
                    "choices":  env
                }
            }
        }

}

for (const cmd in commandList) {
    if (commandList.hasOwnProperty(cmd)) {
        if (process.argv[2] === cmd) {
             argv = yargs
            .command(cmd, commandList[cmd].description, function(){}, function(argv){
                executableCmd = commandList[cmd].command;
                for (const opt in commandList[cmd].options) {
                    if (commandList[cmd].options.hasOwnProperty(opt)) {
                        executableCmd = executableCmd.replace(new RegExp(escapeRegExp(opt), 'g'), argv[opt]);
                    }
                }
                executeCommand();
            })
            .options(commandList[cmd].options)
            .help()
            .alias('help', 'h')
            .argv;
        }
    }
}


function escapeRegExp(string){
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function executeCommand(){
    try {
  //      console.log(executableCmd, 'executableCmd');
         execSync(executableCmd, {stdio: 'inherit'});
    } catch(error) {
        // console.error(error);
    }
}
