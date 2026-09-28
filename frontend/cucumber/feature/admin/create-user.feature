# language: es
Característica: Admin crea usuarios
    
    Antecedentes: 
        Dado que el admin está autenticado en el panel.

    Escenario: El admin crea el nuevo usuario.
        Cuando navega a la pestaña Usuarios 
        Y hace click en nuevo usuario
        Y completa el formulario de usuario y lo guarda
        Entonces el nuevo usuario aparece en la tabla de usuarios

    Escenario: El admin cancela la creación de un usuario
        Cuando navega a la pestaña Usuarios
        Y hace click en nuevo usuario
        Y cancela el formulario de usuario
        Entonces el formulario del usuario no está visible

