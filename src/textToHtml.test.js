import { describe, it, expect } from 'vitest';
import { textToHtml } from './textToHtml.js'

// test('Straight text', () => {
//   expect(textToHtml("word")).toBe("word")
// })

describe('textToHtml', () => {
  describe('HTML meta-character escaping', () => {
    it('should escape less than (<)', () => {
      expect(textToHtml('5 < 10')).toBe('5 &#x3C; 10');
    });

    it('should escape > character', () => {
      const result = textToHtml('a > b');
      expect(result).toBe('a &#x3E; b');
    });

    it('should escape <script>', () => {
      const result = textToHtml('<script>');
      expect(result).toBe('&#x3C;script&#x3E;');
    });

    it('should escape & character', () => {
      const result = textToHtml('Tom & Jerry');
      expect(result).toBe('Tom &#x26; Jerry');
    });

    it('should escape " (double quote) character', () => {
      const result = textToHtml('He said "hello"');
      expect(result).toBe('He said &#x22;hello&#x22;');
    });

    it('should escape \' (single quote) character', () => {
      const result = textToHtml("It's working");
      expect(result).toBe('It&#x27;s working');
    });

    it('should escape ` (backtick) character', () => {
      const result = textToHtml('`');
      expect(result).toBe('&#x60;');
    });

    it('should not escape \\ (backslash) character', () => {
      const result = textToHtml('\\');
      expect(result).toBe('\\');
    });

    it('should not escape non-html special characters', () => {
      const result = textToHtml("!#$%()*+,-./:;=?@[]^_{|}~");
      expect(result).toBe('!#$%()*+,-./:;=?@[]^_{|}~');
    });

    it('should only process & in URLs', () => {
      const result = textToHtml('http://example.com?param=value&other=123');
      expect(result).toBe('http://example.com?param=value&#x26;other=123');
    });

    it('should escape multiple HTML characters in a string', () => {
      const result = textToHtml('<div class="test">Hello & goodbye</div>');
      expect(result).toBe('&#x3C;div class=&#x22;test&#x22;&#x3E;Hello &#x26; goodbye&#x3C;/div&#x3E;');
    });
  });

  describe('XSS prevention', () => {
    it('should prevent script tag injection', () => {
      const result = textToHtml('<script>alert("XSS")</script>');
      expect(result).not.toContain('<script>');
      expect(result).toBe('&#x3C;script&#x3E;alert(&#x22;XSS&#x22;)&#x3C;/script&#x3E;');
    });

    it('should not prevent img tag with onerror', () => {
      const result = textToHtml('<img src=x onerror="alert(1)">');
      expect(result).not.toContain('<img');
      expect(result).toContain('onerror');
    });

    it('should not remove javascript', () => {
      const result = textToHtml('<a href="javascript:alert(1)">Click</a>');
      expect(result).toContain('javascript:');
      expect(result).not.toContain('<a');
    });

    it('should prevent event handler attributes', () => {
      const result = textToHtml('<div onclick="alert(1)">Click me</div>');
      expect(result).toContain('onclick');
      expect(result).not.toContain('<div');
    });
  });

describe('lower case x and uppercase hexadecimals', () => {
    it('should use lower case x in hex escapes', () => {
      const result = textToHtml('<>&"\'');
      expect(result).toMatch(/&#x[0-9A-F]+;/);
      expect(result).not.toMatch(/&#X[0-9a-f]+;/);
    });

    it('should use uppercase hexadecimal digits', () => {
      const result = textToHtml('<>&"\'');
      expect(result).not.toContain('&#x3c'); // lowercase c
      expect(result).toContain('&#x3C'); // uppercase C
    });

    it('should not use named entities', () => {
      const result = textToHtml('<>&"\'');
      expect(result).not.toContain('&lt;');
      expect(result).not.toContain('&gt;');
      expect(result).not.toContain('&amp;');
      expect(result).not.toContain('&quot;');
      expect(result).not.toContain('&apos;');
    });
  });

  describe('Unicode character handling', () => {
    it('should handle basic ASCII characters', () => {
      const result = textToHtml('Hello World');
      expect(result).toBe('Hello World');
    });

    it('should handle emoji characters', () => {
      const result = textToHtml('Hello 😀!');
      expect(result).toBe('Hello &#x1F600;!');
    });

    it('should handle Chinese characters', () => {
      const result = textToHtml('你好世界');
      expect(result).toContain('&#x4F60;&#x597D;&#x4E16;&#x754C;');
    });

    it('should handle Arabic characters', () => {
      const result = textToHtml('مرحبا');
      expect(result).toContain('&#x645;&#x631;&#x62D;&#x628;&#x627;');
    });

    it('should handle mixed Unicode and special chars', () => {
      const result = textToHtml('Hello <世界>');
      expect(result).toContain('&#x4E16;&#x754C;');
      expect(result).toContain('&#x3C;');
      expect(result).toContain('&#x3E;');
    });

    it('should handle Unicode combining characters', () => {
      const result = textToHtml('café'); // e with combining acute
      expect(result).toBe('caf&#xE9;');
    });
  });

  describe('Handle line breaks', () => {
    it('should add <br> before line feed', () => {
      const result = textToHtml('Line 1\nLine 2');
      expect(result).toBe('Line 1<br>\nLine 2');
    });

    it('should handle carriage return', () => {
      const result = textToHtml('Line 1\rLine 2');
      expect(result).toBe('Line 1<br>\nLine 2');
    });

    it('should handle CRLF (Windows line endings)', () => {
      const result = textToHtml('Line 1\r\nLine 2');
      expect(result).not.toContain('\r');
      expect(result).toBe('Line 1<br>\nLine 2');
    });

    it('should handle multiple line feeds', () => {
      const result = textToHtml('Line 1\n\nLine 2');
      expect(result).toBe('Line 1<br>\n<br>\nLine 2');
    });

    it('should handle line feed at start', () => {
      const result = textToHtml('\nLine 1');
      expect(result).toBe('<br>\nLine 1');
    });

    it('should handle line feed at end', () => {
      const result = textToHtml('Line 1\n');
      expect(result).toBe('Line 1<br>\n');
    });
  });

  describe('edge cases', () => {
    it('should handle null', () => {
      const result = textToHtml(null);
      expect(result).toBe('');
    });        

    it('should handle empty string', () => {
      const result = textToHtml('');
      expect(result).toBe('');
    });

    it('should handle non-string data type', () => {
      const result = textToHtml(99);
      expect(result).toBe('');
    });   

    it('should handle plain text without special characters', () => {
      const result = textToHtml('Hello World');
      expect(result).toBe('Hello World');
    });

    it('should handle string with only spaces', () => {
      const result = textToHtml('   ');
      expect(result).toBe('   ');
    });

    it('should handle numbers', () => {
      const result = textToHtml('12345');
      expect(result).toBe('12345');
    });

    it('should handle alphanumeric text', () => {
      const result = textToHtml('abc123XYZ');
      expect(result).toBe('abc123XYZ');
    });

    it('should preserve safe characters', () => {
      const result = textToHtml('Hello! How are you? I am fine. Cool.');
      expect(result).toBe('Hello! How are you? I am fine. Cool.');
    });
  });
  
  describe('combined scenarios', () => {
    it('should handle special chars and line breaks together', () => {
      const result = textToHtml('<script>\nalert("XSS")\n</script>');
      expect(result).toBe('&#x3C;script&#x3E;<br>\nalert(&#x22;XSS&#x22;)<br>\n&#x3C;/script&#x3E;');
    });

    it('should handle all special chars together', () => {
      const result = textToHtml('<tag attr="value" & more=\'stuff\' />');
      expect(result).toContain('&#x3C;');
      expect(result).toContain('&#x3E;');
      expect(result).toContain('&#x22;');
      expect(result).toContain('&#x27;');
      expect(result).toContain('&#x26;');
    });

    it('should handle CRLF with special chars', () => {
      const result = textToHtml('Line 1 & more\r\nLine 2 <tag>');
      expect(result).toBe('Line 1 &#x26; more<br>\nLine 2 &#x3C;tag&#x3E;');
    });

    it('should handle complex real-world example', () => {
      const input = 'User comment:\n<script>alert("hack")</script>\nRating: 5/5 ⭐\r\nReview: "Great product!"';
      const result = textToHtml(input);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('\r');
      expect(result).toContain('<br>');
      expect(result).toContain('&#x2B50;<br>');
      expect(result).toContain('&#x22;');
    });    
});
});
