"""Constants for resource upload validation."""

ACCEPTED_RESOURCE_MIME_TYPES = [
    # Images
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",

    # Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.oasis.opendocument.text",

    # Présentations
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    # Tableurs
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",

    # Code / texte
    "text/plain",
    "text/x-python",
    "application/javascript",

    # Archives
    "application/zip",
    "application/x-zip-compressed",
    "application/x-zip",
    "application/vnd.rar",
    "application/x-7z-compressed",

    # Binaire générique (électronique / projets)
    "application/octet-stream",
    "application/acad",
    "application/dxf",
    "model/step",
    "model/iges",
    "model/stl"
]
