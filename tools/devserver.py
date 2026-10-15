# 개발용 정적 서버: 브라우저가 옛 파일을 캐시하지 않도록 no-store 헤더를 붙인다.
# 사용법: python tools/devserver.py [포트]
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    root = Path(__file__).resolve().parent.parent
    handler = partial(NoCacheHandler, directory=str(root))
    NoCacheHandler.extensions_map['.js'] = 'text/javascript'
    NoCacheHandler.extensions_map['.webmanifest'] = 'application/manifest+json'
    print(f'serving {root} on http://0.0.0.0:{port}')
    ThreadingHTTPServer(('0.0.0.0', port), handler).serve_forever()
