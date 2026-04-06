export const ACCEPTED_RESOURCE_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",

  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",

  // Présentations
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  // Tableurs
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",

  // Code / texte
  "text/plain",
  "text/x-python",
  "application/javascript",

  // Archives
  "application/zip",
  "application/vnd.rar",
  "application/x-7z-compressed",

  // Binaire générique (électronique / projets)
  "application/octet-stream",
  "application/acad",
  "application/dxf",
  "model/step",
  "model/iges",
  "model/stl"
] as const;


export const ACCEPTED_RESOURCE_FILE_EXTENSIONS =
  ".jpeg,.jpg,.png,.webp," +

  // Documents
  ".pdf,.doc,.docx,.odt,.txt," +

  // Présentations
  ".ppt,.pptx," +

  // Tableurs
  ".xls,.xlsx,.csv," +

  // Code
  ".c,.cpp,.h,.py,.java,.js,.ts," +

  // Electronique / simulation
  ".sch,.pcb,.brd,.kicad_sch,.kicad_pcb," +
  ".cir,.asc,.sp,.spice," +

  // CAO
  ".dwg,.dxf,.step,.stp,.iges,.igs,.stl,.sldprt,.sldasm" +

  // Embarqué
  ".ino,.hex,.elf,.bin," +

  // FPGA
  ".vhd,.v,.sv," +

  // Simulation
  ".slx,.mdl," +

  // Archives
  ".zip,.rar,.7z";