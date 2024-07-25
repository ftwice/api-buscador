// Añadir evento de escucha para el formulario al enviar
document.getElementById('pelicula-formulario').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevenir la acción por defecto del formulario

    // Obtener los valores de los campos del formulario
    const nombrePelicula = document.getElementById('nombre-pelicula').value;
    const año = document.getElementById('año').value;
    const director = document.getElementById('director').value;

    // Validación: No se permite la búsqueda solo por año
    if (!nombrePelicula && !director) {
        document.getElementById('respuesta').innerText = 'Por favor ingrese al menos una película o un director. Nota: La búsqueda por director no es admitida por la API.';
        return;
    }

    // Validación: No se permite la búsqueda solo por director por la limitación de la API
    if (!nombrePelicula && director) {
        document.getElementById('respuesta').innerText = 'No se permite la búsqueda solo por Director.';
        return;
    }

    // Llamar a la función para buscar la película
    buscarPelicula(nombrePelicula, año, director, true);
});

// Función para buscar la película en la API
function buscarPelicula(nombrePelicula, año, director, guardarBusquedaFlag) {
    const apiKey = '1bc64afd'; // Clave de la API
    let url = `https://www.omdbapi.com/?apikey=${apiKey}&type=movie`;

    // Añadir parámetros de búsqueda a la URL
    if (nombrePelicula) url += `&s=${encodeURIComponent(nombrePelicula)}`;
    if (año) url += `&y=${encodeURIComponent(año)}`;

    // Realizar la solicitud a la API
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const respuestaDiv = document.getElementById('respuesta');
            respuestaDiv.innerHTML = '';

            // Comprobar si la respuesta de la API es positiva
            if (data.Response === "True") {
                const promesas = data.Search.map(pelicula => {
                    const detalleUrl = `https://www.omdbapi.com/?i=${pelicula.imdbID}&apikey=${apiKey}`;
                    return fetch(detalleUrl).then(res => res.json());
                });

                // Esperar a que todas las solicitudes de detalles de películas se completen
                Promise.all(promesas).then(peliculasDetalladas => {
                    const peliculasFiltradas = peliculasDetalladas.filter(pelicula => {
                        return (!director || pelicula.Director.toLowerCase().includes(director.toLowerCase())) &&
                               (!nombrePelicula || pelicula.Title.toLowerCase().includes(nombrePelicula.toLowerCase()));
                    });

                    // Comprobar si se encontraron películas con los criterios especificados
                    if (peliculasFiltradas.length > 0) {
                        peliculasFiltradas.forEach(pelicula => {
                            let detalles = '';

                            // Añadir detalles de la película a la respuesta
                            if (pelicula.Director && pelicula.Director !== "N/A") detalles += `<p><strong>Director:</strong> ${pelicula.Director}</p>`;
                            if (pelicula.Writer && pelicula.Writer !== "N/A") detalles += `<p><strong>Escritores:</strong> ${pelicula.Writer}</p>`;
                            if (pelicula.Actors && pelicula.Actors !== "N/A") detalles += `<p><strong>Actores:</strong> ${pelicula.Actors}</p>`;
                            if (pelicula.Genre && pelicula.Genre !== "N/A") detalles += `<p><strong>Género:</strong> ${pelicula.Genre}</p>`;
                            if (pelicula.Language && pelicula.Language !== "N/A") detalles += `<p><strong>Idioma:</strong> ${pelicula.Language}</p>`;
                            if (pelicula.Country && pelicula.Country !== "N/A") detalles += `<p><strong>País:</strong> ${pelicula.Country}</p>`;
                            if (pelicula.Awards && pelicula.Awards !== "N/A") detalles += `<p><strong>Premios:</strong> ${pelicula.Awards}</p>`;
                            if (pelicula.Plot && pelicula.Plot !== "N/A") detalles += `<p><strong>Trama:</strong> ${pelicula.Plot}</p>`;
                            if (pelicula.Rated && pelicula.Rated !== "N/A") detalles += `<p><strong>Clasificación:</strong> ${pelicula.Rated}</p>`;
                            if (pelicula.Runtime && pelicula.Runtime !== "N/A") detalles += `<p><strong>Duración:</strong> ${pelicula.Runtime}</p>`;

                            let poster = pelicula.Poster !== "N/A" ? `<img src="${pelicula.Poster}" alt="Poster de ${pelicula.Title}">` : '';

                            // Mostrar detalles de la película en el contenedor de respuesta
                            respuestaDiv.innerHTML += 
                                `<div>
                                    <h3>${pelicula.Title} (${pelicula.Year})</h3>
                                    ${detalles}
                                    ${poster}
                                </div>`;
                        });

                        // Guardar la búsqueda en el historial si es necesario
                        if (guardarBusquedaFlag) {
                            guardarBusqueda(nombrePelicula, año, director);
                            mostrarBusquedasPrevias();
                        }
                    } else {
                        respuestaDiv.innerText = 'No se encontraron películas para los criterios especificados.';
                    }
                });
            } else {
                respuestaDiv.innerText = 'Película no encontrada.';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('respuesta').innerText = 'Hubo un error al obtener la información de la película.';
        });
}

// Función para guardar una búsqueda en el almacenamiento local
function guardarBusqueda(nombrePelicula, año, director) {
    let busquedas = JSON.parse(localStorage.getItem('busquedas')) || [];
    const busqueda = { nombrePelicula, año, director };
    const busquedaTexto = construirTextoBusqueda(busqueda);
    if (!busquedas.some(b => construirTextoBusqueda(b) === busquedaTexto)) {
        busquedas.push(busqueda);
        localStorage.setItem('busquedas', JSON.stringify(busquedas));
    }
}

// Función para construir el texto de búsqueda
function construirTextoBusqueda({ nombrePelicula, año, director }) {
    let textoBusqueda = nombrePelicula;
    if (año) {
        textoBusqueda += `, ${año}`;
    }
    if (director) {
        textoBusqueda += `, ${director}`;
    }
    return textoBusqueda;
}

// Función para mostrar las búsquedas previas
function mostrarBusquedasPrevias() {
    const listaBusquedas = document.getElementById('lista-busquedas');
    listaBusquedas.innerHTML = '';
    let busquedas = JSON.parse(localStorage.getItem('busquedas')) || [];

    busquedas.forEach((busqueda, index) => {
        let item = document.createElement('li');
        item.textContent = construirTextoBusqueda(busqueda);
        item.addEventListener('click', () => {
            buscarPelicula(busqueda.nombrePelicula, busqueda.año, busqueda.director, false);
        });
        listaBusquedas.appendChild(item);
    });
}

// Mostrar las búsquedas previas al cargar la página
document.addEventListener('DOMContentLoaded', mostrarBusquedasPrevias);