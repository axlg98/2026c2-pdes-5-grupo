# language: es
@admin
Característica: Gestión de usuarios por parte del administrador
    Para que las personas puedan usar la plataforma con los permisos adecuados
    Como administrador
    Quiero crear cuentas y asignarles un rol

    Escenario: Crear una cuenta para una agencia
        Dado que estoy autenticado con el rol "admin"
        Cuando solicito crear una cuenta para "Ana Pérez" con el correo "ana@example.com", la contraseña "clave123" y el rol "agencia"
        Entonces la respuesta tiene estado 201
        Y el sistema confirma que se creó la cuenta de "Ana Pérez" con el rol "agencia"

    Escenario: No crear una cuenta si faltan datos obligatorios
        Dado que estoy autenticado con el rol "admin"
        Cuando solicito crear una cuenta para "Ana Pérez" con el correo "", la contraseña "clave123" y el rol "agencia"
        Entonces la respuesta tiene estado 400
        Y el sistema explica el error "Nombre, email, password y rol son obligatorios."

    Escenario: No asignar un rol que no existe
        Dado que estoy autenticado con el rol "admin"
        Cuando solicito crear una cuenta para "Ana Pérez" con el correo "ana@example.com", la contraseña "clave123" y el rol "superadmin"
        Entonces la respuesta tiene estado 400
        Y el sistema explica el error "Rol inválido."

    Escenario: Impedir que una persona compradora cree cuentas
        Dado que estoy autenticado con el rol "comprador"
        Cuando solicito crear una cuenta para "Ana Pérez" con el correo "ana@example.com", la contraseña "clave123" y el rol "agencia"
        Entonces la respuesta tiene estado 403
        Y el sistema explica el error "No tenés permisos para esta acción."
