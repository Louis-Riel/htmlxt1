
export default function getType(url:string):string{
    const ext = /.*([.][a-z]{2,4}$)/g
    switch (ext.exec(url)?.at(1)) {
        case '.aac':
            return 'audio/aac';
        case '.abw':
            return 'application/x-abiword';
        case '.arc':
            return 'application/x-freearc';
        case '.avif':
            return 'image/avif';
        case '.avi':
            return 'video/x-msvideo';
        case '.azw':
            return 'application/vnd.amazon.ebook';
        case '.bin':
            return 'application/octet-stream';
        case '.bmp':
            return 'image/bmp';
        case '.bz':
            return 'application/x-bzip';
        case '.bz2':
            return 'application/x-bzip2';
        case '.cda':
            return 'application/x-cdf';
        case '.csh':
            return 'application/x-csh';
        case '.css':
            return 'text/css';
        case '.csv':
            return 'text/csv';
        case '.doc':
            return 'application/msword';
        case '.docx':
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case '.eot':
            return 'application/vnd.ms-fontobject';
        case '.epub':
            return 'application/epub+zip';
        case '.gz':
            return 'application/gzip';
        case '.gif':
            return 'image/gif';
        case '.htm, .html':
            return 'text/html';
        case '.ico':
            return 'image/vnd.microsoft.icon';
        case '.ics':
            return 'text/calendar';
        case '.jar':
            return 'application/java-archive';
        case '.jpeg, .jpg':
            return 'image/jpeg';
        case '.js':
            return 'text/javascript (Specifications: HTML and RFC 9239)';
        case '.json':
            return 'application/json';
        case '.jsonld':
            return 'application/ld+json';
        case '.mid, .midi':
            return 'audio/midi, audio/x-midi';
        case '.mjs':
            return 'text/javascript';
        case '.mp3':
            return 'audio/mpeg';
        case '.mp4':
            return 'video/mp4';
        case '.mpeg':
            return 'video/mpeg';
        case '.mpkg':
            return 'application/vnd.apple.installer+xml';
        case '.odp':
            return 'application/vnd.oasis.opendocument.presentation';
        case '.ods':
            return 'application/vnd.oasis.opendocument.spreadsheet';
        case '.odt':
            return 'application/vnd.oasis.opendocument.text';
        case '.oga':
            return 'audio/ogg';
        case '.ogv':
            return 'video/ogg';
        case '.ogx':
            return 'application/ogg';
        case '.opus':
            return 'audio/opus';
        case '.otf':
            return 'font/otf';
        case '.png':
            return 'image/png';
        case '.pdf':
            return 'application/pdf';
        case '.php':
            return 'application/x-httpd-php';
        case '.ppt':
            return 'application/vnd.ms-powerpoint';
        case '.pptx':
            return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        case '.rar':
            return 'application/vnd.rar';
        case '.rtf':
            return 'application/rtf';
        case '.sh':
            return 'application/x-sh';
        case '.svg':
            return 'image/svg+xml';
        case '.tar':
            return 'application/x-tar';
        case '.tif, .tiff':
            return 'image/tiff';
        case '.ts':
            return 'video/mp2t';
        case '.ttf':
            return 'font/ttf';
        case '.txt':
            return 'text/plain';
        case '.vsd':
            return 'application/vnd.visio';
        case '.wav':
            return 'audio/wav';
        case '.weba':
            return 'audio/webm';
        case '.webm':
            return 'video/webm';
        case '.webp':
            return 'image/webp';
        case '.woff':
            return 'font/woff';
        case '.woff2':
            return 'font/woff2';
        case '.xhtml':
            return 'application/xhtml+xml';
        case '.xls':
            return 'application/vnd.ms-excel';
        case '.xlsx':
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case '.xml':
            return 'application/xml is recommended as of RFC 7303 (section 4.1), but text/xml is still used sometimes. You can assign a specific MIME type to a file with .xml extension depending on how its contents are meant to be interpreted. For instance, an Atom feed is application/atom+xml, but application/xml serves as a valid default.';
        case '.xul':
            return 'application/vnd.mozilla.xul+xml';
        case '.zip':
            return 'application/zip';
        case '.3gp':
            return "video/3gpp; audio/3gpp if it doesn't contain video";
        case '.3g2':
            return "video/3gpp2; audio/3gpp2 if it doesn't contain video";
        case '.7z':
            return 'application/x-7z-compressed';
        default:
            return "application/octet-stream";
    }
}