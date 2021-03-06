import * as kt from "karma-typescript";
import * as log4js from "log4js";
import * as path from "path";

let log: log4js.Logger;

const fixWindowsPath = (value: string): string => {
    return value.replace(/\\/g, "/");
};

const transform: kt.Transform = (context: kt.TransformContext, callback: kt.TransformCallback) => {

    if (!context.ts) {
        return callback(undefined, false);
    }

    let dirty = false;

    const templateUrlRegex = /templateUrl:\s(['"][^"']*['"])/g;
    const styleUrlsRegex = /styleUrls:\s\[(.*)\]/g;
    const quotedStringRegex = /["'](.*?)["']/g;

    const rewriteUrl = (regexp: RegExp) => {

        const match = regexp.exec(context.ts.transpiled);

        if (!match) {
            return;
        }

        const original = match[0];
        const value = match[1];
        const templateDir = path.dirname(context.filename);
        const relativeTemplateDir = path.relative(context.config.karma.basePath, templateDir);

        let pattern = original;
        let quotedStringMatch = quotedStringRegex.exec(value);

        while (quotedStringMatch) {

            const unquotedString = quotedStringMatch[1];
            const url = path.join(context.config.karma.urlRoot, "base", relativeTemplateDir, unquotedString);
            log.debug("Rewriting %s to %s in %s", unquotedString, url, context.filename);

            pattern = pattern.replace(unquotedString, fixWindowsPath(url));
            quotedStringMatch = quotedStringRegex.exec(value);
        }

        context.ts.transpiled = context.ts.transpiled.replace(original, pattern);
        dirty = true;
    };

    rewriteUrl(styleUrlsRegex);
    rewriteUrl(templateUrlRegex);

    return callback(undefined, dirty, false);
};

const initialize: kt.TransformInitialize = (logOptions: kt.TransformInitializeLogOptions) => {
    log4js.configure({
        appenders: logOptions.appenders,
        categories: {
            default: {
                appenders: Object.keys(logOptions.appenders),
                level: logOptions.level
            }
        }
    });
    log = log4js.getLogger("angular2-transform.karma-typescript");
};

const exp = Object.assign(transform, { initialize });
export = exp;
