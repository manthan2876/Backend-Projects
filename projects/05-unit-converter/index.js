import { createServer } from 'http';
import { parse } from 'querystring';
import { convertLength, convertWeight, convertTemperature } from './conversionUtility.js';

const PORT = 3000;

// 1. ADDED: Define your exact units here to populate the dropdown menus
const UNIT_OPTIONS = {
    length: ['meter', 'centimeter', 'millimeter', 'kilometer', 'inch', 'foot', 'yard', 'mile'],
    weight: ['kilogram', 'gram', 'milligram', 'pound', 'ounce'],
    temperature: ['Celsius', 'Fahrenheit', 'Kelvin']
};

/**
 * Hardcoded markup structural template block serving clean responsive UI form structures.
 * Features customizable layout insertion points to append computation outcomes.
 * @param {string} tabType - Configures active highlighted module tabs ('length', 'weight', 'temperature').
 * @param {string} resultText - Renderable calculations result output wrapper text injection payload.
 * @returns {string} Fully valid standard textual HTML web asset code string.
 */
function getHtmlViewTemplate(tabType = 'length', resultText = '') {
    // 2. ADDED: Fetch units for the current active tab
    const units = UNIT_OPTIONS[tabType] || [];
    
    // 3. ADDED: Map units array into HTML <option> tags
    const unitOptionsMarkup = units
        .map(unit => `<option value="${unit}">${unit}</option>`)
        .join('\n');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Unit Converter Web App App Suite Workspace</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; background: #fafafa; color: #333; }
        .container { max-width: 600px; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .nav-tabs { display: flex; gap: 15px; margin-bottom: 25px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .nav-tabs a { text-decoration: none; color: #666; font-weight: bold; padding: 5px 10px; }
        .nav-tabs a.active { color: #0066cc; border-bottom: 3px solid #0066cc; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: 500; }
        input, select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        button { background: #0066cc; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .result-box { margin-top: 20px; padding: 15px; background: #e6f2ff; border-left: 5px solid #0066cc; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Unit Converter Engine</h2>
        <div class="nav-tabs">
            <a href="/length" class="${tabType === 'length' ? 'active' : ''}">Length</a>
            <a href="/weight" class="${tabType === 'weight' ? 'active' : ''}">Weight</a>
            <a href="/temperature" class="${tabType === 'temperature' ? 'active' : ''}">Temperature</a>
        </div>
        <form method="POST" action="/${tabType}">
            <div class="form-group">
                <label>Value to Convert:</label>
                <input type="number" step="any" name="value" placeholder="Enter scalar amount value" required />
            </div>
            <div class="form-group">
                <label>Convert From:</label>
                <select name="fromUnit" required>
                    <option value="">-- Choose Unit --</option>
                    ${unitOptionsMarkup} 
                </select>
            </div>
            <div class="form-group">
                <label>Convert To:</label>
                <select name="toUnit" required>
                    <option value="">-- Choose Unit --</option>
                    ${unitOptionsMarkup} 
                </select>
            </div>
            <button type="submit">Execute Conversion</button>
        </form>
        ${resultText ? `<div class="result-box"><strong>Result of calculation:</strong><br/><h3>${resultText}</h3></div>` : ''}
    </div>
</body>
</html>
`;
}

/**
 * Intercepts connection hooks, routing endpoints down to resource renders or processing streams.
 */
function handleServerConnection(req, res) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        let pathname = parsedUrl.pathname;
        const method = req.method;

        if (pathname === '/' || pathname === '') {
            pathname = '/length';
        }

        const routeTarget = pathname.substring(1);

        if (['length', 'weight', 'temperature'].includes(routeTarget)) {
            if (method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(getHtmlViewTemplate(routeTarget));
                return resolve();
            } 
            
            if (method === 'POST') {
                let body = '';
                
                req.on('data', chunk => {
                    body += chunk.toString();
                });
                
                req.on('end', () => {
                    const parsedForm = parse(body);
                    let resultText;

                    try {
                        const value = parseFloat(parsedForm.value);
                        const fromUnit = parsedForm.fromUnit;
                        const toUnit = parsedForm.toUnit;

                        if (isNaN(value) || !fromUnit || !toUnit) {
                            throw new Error("Invalid Input");
                        }

                        switch (routeTarget) {
                            case 'length':
                                resultText = `${value} ${fromUnit} = ${convertLength(value, fromUnit, toUnit).toFixed(2)} ${toUnit}`;
                                break;
                            case 'weight':
                                resultText = `${value} ${fromUnit} = ${convertWeight(value, fromUnit, toUnit).toFixed(2)} ${toUnit}`;
                                break;
                            case 'temperature':
                                resultText = `${value} ${fromUnit} = ${convertTemperature(value, fromUnit, toUnit).toFixed(2)} ${toUnit}`;
                                break;
                        }
                    } catch (error) {
                        resultText = "Error occurred during conversion. Please check your inputs.";
                    }

                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(getHtmlViewTemplate(routeTarget, resultText));
                    resolve();
                });

                req.on('error', (err) => {
                    reject(err);
                });
                return;
            }
        }

        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Web resource route target location could not be located.');
        resolve();
    });
}

/**
 * Initializes application web network listeners blocks.
 */
function main() {
    const server = createServer(async (req, res) => {
        try {
            await handleServerConnection(req, res);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('System encountered an unexpected request boundary compilation error.');
        }
    });

    server.listen(PORT, () => {
        console.log(`Unit Converter Server Application platform actively listening on web port: ${PORT}`);
    });
}

main();
