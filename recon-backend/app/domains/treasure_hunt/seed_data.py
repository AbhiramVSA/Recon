import hashlib


def _hash_flag(flag: str) -> str:
    return hashlib.sha256(flag.strip().lower().encode("utf-8")).hexdigest()


TREASURE_HUNT_PROBLEM_SEED: list[dict[str, str | int | bool | None]] = [
    {
        "slug": "dancing-men",
        "title": "Dancing Men",
        "teaser": "Decode the Sherlock-style glyphs hidden in the recovered strip.",
        "body_markdown": (
            "A field notebook included the cipher strip below. Decode it to recover the flag.\n\n"
            "![Dancing Men cipher](/hunt-assets/dancing-men.png)"
        ),
        "hint_markdown": "This uses the classic **Dancing Men** substitution cipher from Sherlock Holmes.",
        "qr_token": "th-01-dancing-men",
        "flag_hash": _hash_flag("ELEMENTARY MY DEAR WATSON"),
        "sort_order": 1,
        "is_active": True,
    },
    {
        "slug": "unown-pokemon-alphabet",
        "title": "Unown Pokemon Alphabet",
        "teaser": "The symbols are not random. Read them with the right alphabet.",
        "body_markdown": (
            "An intercepted image uses a familiar game-world glyph set. Decode it to recover the flag.\n\n"
            "![Unown alphabet challenge](/hunt-assets/pokemon-unown.png)"
        ),
        "hint_markdown": "Treat the symbols as the **Pokemon Unown alphabet**.",
        "qr_token": "th-02-unown-pokemon-alphabet",
        "flag_hash": _hash_flag("THE DARK KNIGHT ALWAYS RISES"),
        "sort_order": 2,
        "is_active": True,
    },
    {
        "slug": "semaphore-trousers-cipher",
        "title": "Semaphore Trousers Cipher",
        "teaser": "The pose matters more than the character. Read the signaling positions.",
        "body_markdown": (
            "The image below hides a message using semaphore-style positions. Decode it to recover the flag.\n\n"
            "![Semaphore Trousers cipher](/hunt-assets/semaphore-trousers.png)"
        ),
        "hint_markdown": "Use a **semaphore alphabet chart**. Focus on the arm and leg positions.",
        "qr_token": "th-03-semaphore-trousers-cipher",
        "flag_hash": _hash_flag("ONE DOES NOT SIMPLY WALK"),
        "sort_order": 3,
        "is_active": True,
    },
    {
        "slug": "lunar-alphabet",
        "title": "Lunar Alphabet",
        "teaser": "The glyphs echo moon phases and arcs. Translate them into letters.",
        "body_markdown": (
            "A lunar-themed symbol sheet was recovered from the drop site. Decode it to recover the flag.\n\n"
            "![Lunar alphabet challenge](/hunt-assets/luna.png)"
        ),
        "hint_markdown": "This puzzle uses a **lunar alphabet** rather than a standard substitution grid.",
        "qr_token": "th-04-lunar-alphabet",
        "flag_hash": _hash_flag("KEEP YOUR FRIENDS CLOSE"),
        "sort_order": 4,
        "is_active": True,
    },
    {
        "slug": "braile-decode",
        "title": "Braile Decode",
        "teaser": "The transmission has no text layer. The dots are the message.",
        "body_markdown": (
            "We intercepted a high-frequency burst from an unknown relay.\n\n"
            "Preliminary analysis shows no text layer or hidden strings in the document body, only a series of "
            "high-contrast visual markers. Our intelligence suggests the data is encoded in Grade 1 Braille, "
            "used as a visual cipher for automated optical systems.\n\n"
            "Open the recovered file and decode the flag:\n\n"
            "[Open transmission log PDF](/hunt-assets/transmission-log-0418.pdf)"
        ),
        "hint_markdown": "Read the document as **Grade 1 Braille**.",
        "qr_token": "th-05-braile-decode",
        "flag_hash": _hash_flag("BRAILLE DECODE SUCCESS"),
        "sort_order": 5,
        "is_active": True,
    },
    {
        "slug": "qr-code",
        "title": "QR Code",
        "teaser": "The obvious scan result is not the whole story.",
        "body_markdown": (
            "Our threat intelligence team intercepted a suspicious QR code posted on an internal NovaTech "
            "noticeboard during last night's shift.\n\n"
            "At first glance it links to a harmless video, but analysts believe it was planted deliberately and "
            "that a second concealed payload is embedded somewhere inside it.\n\n"
            "Inspect the challenge asset and recover the hidden flag:\n\n"
            "![Challenge QR](/hunt-assets/challenge-qr.png)"
        ),
        "hint_markdown": "The visible scan result is a decoy. Inspect the artifact more closely for hidden data.",
        "qr_token": "th-06-qr-code",
        "flag_hash": _hash_flag("HIDDEN IN PLAIN SIGHT"),
        "sort_order": 6,
        "is_active": True,
    },
    {
        "slug": "satellite-intercept",
        "title": "Satellite Intercept",
        "teaser": "The image cache survived. The metadata tells the rest of the story.",
        "body_markdown": (
            "A rogue field agent was tracked to a secure location, but they managed to wipe their device before "
            "being apprehended.\n\n"
            "However, our digital forensics team recovered a single image from the cache: a surveillance shot of "
            "a satellite intercept. Inspect the metadata and see whether the user left behind a link.\n\n"
            "![Recovered field image](/hunt-assets/field-evidence-099.jpg)"
        ),
        "hint_markdown": "Do not stop at the pixels. Check the image **metadata / EXIF**.",
        "qr_token": "th-07-satellite-intercept",
        "flag_hash": _hash_flag("EXIF FOUND HOSTEL TRACE"),
        "sort_order": 7,
        "is_active": True,
    },
    {
        "slug": "nokia-3310-lost-signals",
        "title": "Nokia 3310: Lost Signals",
        "teaser": "Before messages were seen, they were heard. Follow the keypad rhythm.",
        "body_markdown": (
            "Before messages were seen, they were heard. A relic from an older network hums quietly "
            "each tone deliberate, each pause meaningful.\n\n"
            "Somewhere in this sequence lies something once dialed, not typed. Those familiar with the rhythm of "
            "classic keypads might recognize the pattern.\n\n"
            "No contacts. No screen. Just echoes of a time when every press made itself known.\n\n"
            "[Download the recovered WAV]"
            "(https://drive.google.com/file/d/1bdrX_R5ULnNmH-Xuy5dt9_MCQBKZZ51e/view?usp=sharing)"
        ),
        "hint_markdown": "Think **classic multi-tap keypad input**. The `#` presses separate letters.",
        "qr_token": "th-08-nokia-3310-lost-signals",
        "flag_hash": _hash_flag("NOKIA IS GOATED ICL"),
        "sort_order": 8,
        "is_active": True,
    },
]
