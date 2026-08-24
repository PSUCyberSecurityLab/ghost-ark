//! Ghost-Ark DAB Tier-0 — trivial HTTP sink for hermetic socket E2E tests.
//!
//! The gateway performs one authorized outbound POST (execute_request) on the
//! CERTIFIED path. This sink stands in for that external tool so the E2E test
//! needs no real network: it captures the content-length-delimited request body
//! when requested and returns 200 OK.
//!
//!   dab-sink [127.0.0.1:8080] [--capture <body-path>]
//!
//! Not part of the TCB and not shipped in production; test scaffolding only.

use std::io::{self, Read, Write};
use std::net::TcpListener;

fn arg_after<'a>(args: &'a [String], flag: &str) -> Option<&'a str> {
    args.iter()
        .position(|arg| arg == flag)
        .and_then(|index| args.get(index + 1))
        .map(String::as_str)
}

fn read_http_request_body(stream: &mut impl Read) -> io::Result<Vec<u8>> {
    let mut request = Vec::new();
    let mut chunk = [0_u8; 4096];

    loop {
        let read = stream.read(&mut chunk)?;
        if read == 0 {
            return Err(io::Error::new(
                io::ErrorKind::UnexpectedEof,
                "HTTP request ended before its complete body arrived",
            ));
        }
        request.extend_from_slice(&chunk[..read]);

        let Some(header_end) = request.windows(4).position(|window| window == b"\r\n\r\n") else {
            continue;
        };
        let body_start = header_end + 4;
        let headers = std::str::from_utf8(&request[..header_end]).map_err(|_| {
            io::Error::new(io::ErrorKind::InvalidData, "HTTP headers were not UTF-8")
        })?;
        let content_length = headers
            .lines()
            .find_map(|line| {
                let (name, value) = line.split_once(':')?;
                name.eq_ignore_ascii_case("content-length")
                    .then(|| value.trim().parse::<usize>().ok())
                    .flatten()
            })
            .ok_or_else(|| {
                io::Error::new(io::ErrorKind::InvalidData, "missing Content-Length header")
            })?;
        let body_end = body_start
            .checked_add(content_length)
            .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidData, "Content-Length overflow"))?;

        if request.len() >= body_end {
            return Ok(request[body_start..body_end].to_vec());
        }
    }
}

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let addr = args
        .first()
        .filter(|arg| !arg.starts_with("--"))
        .cloned()
        .unwrap_or_else(|| "127.0.0.1:8080".into());
    let capture_path = arg_after(&args, "--capture");
    let listener = TcpListener::bind(&addr).expect("bind sink");
    eprintln!("dab-sink listening on {addr}");

    for mut stream in listener.incoming().flatten() {
        let body = read_http_request_body(&mut stream).expect("read complete HTTP request body");
        if let Some(path) = capture_path {
            std::fs::write(path, body).expect("capture gateway request body");
        }
        let _ =
            stream.write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;

    #[test]
    fn captures_a_content_length_delimited_binary_body() {
        let body = [0_u8, b'd', b'e', b'c', b'o', b'd', b'e', b'd', 0xff];
        let mut request =
            b"POST / HTTP/1.1\r\nHost: localhost\r\nContent-Length: 9\r\n\r\n".to_vec();
        request.extend_from_slice(&body);

        assert_eq!(
            read_http_request_body(&mut Cursor::new(request)).unwrap(),
            body
        );
    }
}
