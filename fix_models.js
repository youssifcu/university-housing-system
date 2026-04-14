const fs = require('fs');
const models = ['StudentRequest', 'Room', 'Report', 'Payment', 'Notification', 'MealBooking', 'Meal', 'HousingRequest', 'Building', 'Application'];

for (const m of models) {
    const path = 'src/models/' + m + '.js';
    if (fs.existsSync(path)) {
        let text = fs.readFileSync(path, 'utf8');
        let newText = text;
        
        // Remove `next` from parameter list
        newText = newText.replace(/pre\('save',\s*function\(\s*next\s*\)\s*\{/g, "pre('save', function() {");
        
        // Remove `next();\n});` or `next(); });` and replace with `});`
        // Mongoose middleware often ends with `next();\n});`
        newText = newText.replace(/next\(\);\s*\}(?![\s\S]*next\(\))/g, "}");
        
        if (text !== newText) {
            fs.writeFileSync(path, newText);
            console.log("Updated", path);
        }
    }
}
