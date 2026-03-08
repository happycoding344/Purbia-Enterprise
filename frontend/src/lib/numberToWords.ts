export function numberToIndianWords(num: number): string {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    const inWords = (n: number): string => {
        if (n < 20) return a[n];
        let res = b[Math.floor(n / 10)];
        if (n % 10 > 0) res += '-' + a[n % 10];
        return res + ' ';
    };

    if (num === 0) return 'zero';
    let str = '';

    // Crore
    if (num >= 10000000) {
        str += inWords(Math.floor(num / 10000000)) + 'crore ';
        num %= 10000000;
    }
    // Lakh
    if (num >= 100000) {
        str += inWords(Math.floor(num / 100000)) + 'lakh ';
        num %= 100000;
    }
    // Thousand
    if (num >= 1000) {
        str += inWords(Math.floor(num / 1000)) + 'thousand ';
        num %= 1000;
    }
    // Hundred
    if (num >= 100) {
        str += inWords(Math.floor(num / 100)) + 'hundred ';
        num %= 100;
    }
    // Remainder
    if (num > 0) {
        if (str != '') str += 'and ';
        str += inWords(Math.floor(num));
    }

    return str.trim().toUpperCase() + ' ONLY';
}
