// Convert text to HTML

const he = require('he');
// npm install he

export function textToHtml(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    // Encode HTML entities using 'he' library
    // This prevents XSS by converting HTML meta-characters like <, >, &, and quotes.
    // Also converts special characters like © to HTML entities
    const encodedText = he.encode(text); // , { 'useNamedReferences': true });

    // Add <br> before lines breaks to preserve line breaks while keeping the HTML readable
    // Handle both \r\n (Windows) and \n (Unix) line breaks
    const htmlText = encodedText.replace(/\r\n|\r|\n/g, '<br>\n');

    return htmlText;    
}

// Why re-invent the wheel?
// export function textToHtml(text) {
//   const map = {
//     '&': '&amp;',
//     '<': '&lt;',
//     '>': '&gt;',
//     '"': '&quot;',
//     "'": '&#039;',
//     "\n": '<br>\n',
//     "\r": '',
//   };
//   return text.replace(/[&<>"'\n\r]/g, (m) => map[m]);
// }

// Add an option to process markdown?
// const { marked } = require('marked');
// // npm install marked
// export function markdownToHtml(text) {
//     return marked(text, { gfm: true, breaks: true });
// }
