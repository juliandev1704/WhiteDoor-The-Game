"""Servidor local para jugar White Door (sin caché, para ver siempre la última versión).

Uso:  python serve.py   y abre http://localhost:5173
"""
import http.server
import socketserver

PORT = 5173


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


socketserver.ThreadingTCPServer.allow_reuse_address = True
socketserver.ThreadingTCPServer.daemon_threads = True
with socketserver.ThreadingTCPServer(("", PORT), NoCacheHandler) as httpd:
    print(f"White Door en http://localhost:{PORT}")
    httpd.serve_forever()
