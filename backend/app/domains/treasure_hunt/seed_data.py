import hashlib


def _hash_flag(flag: str) -> str:
    return hashlib.sha256(flag.strip().lower().encode("utf-8")).hexdigest()


TREASURE_HUNT_PROBLEM_SEED: list[dict[str, str | int | bool | None]] = [
    {
        "slug": "shifted-ssid",
        "title": "Shifted SSID",
        "teaser": "The Wi-Fi sticky note looks shifted. Recover the real flag.",
        "body_markdown": (
            "A volunteer wrote the guest Wi-Fi clue using a Caesar shift of `+3`.\n\n"
            "Decode this text to get the flag:\n\n"
            "```text\nUHFRQ{FDHVDU_RYHU_FRIIHH}\n```"
        ),
        "hint_markdown": "Shift every alphabet character **back by 3**. Symbols stay the same.",
        "qr_token": "th-01-shifted-ssid",
        "flag_hash": _hash_flag("RECON{CAESAR_OVER_COFFEE}"),
        "sort_order": 1,
        "is_active": True,
    },
    {
        "slug": "badge-b64",
        "title": "Badge B64",
        "teaser": "A badge printer leak exposed a base64 blob.",
        "body_markdown": (
            "The badge printer log stored this blob. Decode it to recover the flag:\n\n"
            "```text\nUkVDT057QjY0X0JBREdFX0JJTkdPfQ==\n```"
        ),
        "hint_markdown": "This is standard **Base64**.",
        "qr_token": "th-02-badge-b64",
        "flag_hash": _hash_flag("RECON{B64_BADGE_BINGO}"),
        "sort_order": 2,
        "is_active": True,
    },
    {
        "slug": "redirect-maze",
        "title": "Redirect Maze",
        "teaser": "A phishing redirect parameter was percent-encoded.",
        "body_markdown": (
            "A suspicious redirect parameter was captured exactly as shown below.\n"
            "Decode the URL-encoded text to get the flag:\n\n"
            "```text\n%52%45%43%4F%4E%7B%55%52%4C%53%5F%43%41%4E%5F%4C%49%45%7D\n```"
        ),
        "hint_markdown": "Each `%XX` is one byte in hexadecimal.",
        "qr_token": "th-03-redirect-maze",
        "flag_hash": _hash_flag("RECON{URLS_CAN_LIE}"),
        "sort_order": 3,
        "is_active": True,
    },
    {
        "slug": "packet-hex",
        "title": "Packet Hex",
        "teaser": "Only the raw packet bytes survived.",
        "body_markdown": (
            "The notes from a packet capture only kept the hex bytes below.\n"
            "Convert the hex into text to recover the flag:\n\n"
            "```text\n5245434f4e7b4845585f44554d50535f54454c4c5f53544f524945537d\n```"
        ),
        "hint_markdown": "Two hex characters form one ASCII byte.",
        "qr_token": "th-04-packet-hex",
        "flag_hash": _hash_flag("RECON{HEX_DUMPS_TELL_STORIES}"),
        "sort_order": 4,
        "is_active": True,
    },
    {
        "slug": "binary-buzz",
        "title": "Binary Buzz",
        "teaser": "An alert came in as straight binary.",
        "body_markdown": (
            "Convert this binary ASCII into text to recover the flag:\n\n"
            "```text\n01010010 01000101 01000011 01001111 01001110 01111011 01000010 01001001 01010100 01010011 01011111 01000010 01000101 01000001 01010100 01011111 01000111 01010101 01000101 01010011 01010011 01000101 01010011 01111101\n```"
        ),
        "hint_markdown": "Split into 8-bit groups and convert each to a character.",
        "qr_token": "th-05-binary-buzz",
        "flag_hash": _hash_flag("RECON{BITS_BEAT_GUESSES}"),
        "sort_order": 5,
        "is_active": True,
    },
    {
        "slug": "rot13-breach",
        "title": "ROT13 Breach",
        "teaser": "Someone called ROT13 encryption. It was not.",
        "body_markdown": (
            "An incident memo says the answer was \"protected\" with ROT13.\n"
            "Undo it to get the flag:\n\n"
            "```text\nERPBA{EBG13_VF_ABG_FRPHEVGL}\n```"
        ),
        "hint_markdown": "Apply **ROT13** once more.",
        "qr_token": "th-06-rot13-breach",
        "flag_hash": _hash_flag("RECON{ROT13_IS_NOT_SECURITY}"),
        "sort_order": 6,
        "is_active": True,
    },
    {
        "slug": "leet-locker",
        "title": "Leet Locker",
        "teaser": "A fake ransomware actor used leetspeak as camouflage.",
        "body_markdown": (
            "Replace the leetspeak characters with letters to recover the flag:\n\n"
            "```text\nR3C0N{L3375P34K_15_N07_3NCRYP710N}\n```"
        ),
        "hint_markdown": "`3=E`, `0=O`, `4=A`, `1=I`, `5=S`, `7=T`.",
        "qr_token": "th-07-leet-locker",
        "flag_hash": _hash_flag("RECON{LEETSPEAK_IS_NOT_ENCRYPTION}"),
        "sort_order": 7,
        "is_active": True,
    },
    {
        "slug": "cookie-crumbs",
        "title": "Cookie Crumbs",
        "teaser": "The secret was split across three cookie fragments.",
        "body_markdown": (
            "Join these fragments in order to reconstruct the flag:\n\n"
            "```text\ncookie_part_1=RECON{COOK\ncookie_part_2=IES_SPLIT_\ncookie_part_3=SECRETS}\n```"
        ),
        "hint_markdown": "Ignore the cookie names and concatenate the values from 1 to 3.",
        "qr_token": "th-08-cookie-crumbs",
        "flag_hash": _hash_flag("RECON{COOKIES_SPLIT_SECRETS}"),
        "sort_order": 8,
        "is_active": True,
    },
    {
        "slug": "header-hunt",
        "title": "Header Hunt",
        "teaser": "The flag is hiding in an HTTP response header.",
        "body_markdown": (
            "Read the response headers carefully and submit the flag value:\n\n"
            "```http\nHTTP/1.1 200 OK\nServer: recon-edge\nX-Trace: 8842af1e\nX-Flag: RECON{READ_THE_HEADERS}\nCache-Control: no-store\n```"
        ),
        "hint_markdown": "You do not need to decode anything here. Read closely.",
        "qr_token": "th-09-header-hunt",
        "flag_hash": _hash_flag("RECON{READ_THE_HEADERS}"),
        "sort_order": 9,
        "is_active": True,
    },
    {
        "slug": "reverse-rumor",
        "title": "Reverse Rumor",
        "teaser": "A phishing rumor pasted the answer backwards.",
        "body_markdown": (
            "Reverse the text below to recover the flag:\n\n"
            "```text\n}SNIW_SCISNEROF_ELIBOM{NOCER\n```"
        ),
        "hint_markdown": "Read it from right to left.",
        "qr_token": "th-10-reverse-rumor",
        "flag_hash": _hash_flag("RECON{MOBILE_FORENSICS_WINS}"),
        "sort_order": 10,
        "is_active": True,
    },
]
