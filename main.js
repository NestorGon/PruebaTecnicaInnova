// Variables to manage pagination
let nextPage = null;
let previousPage = null;
let baseUrl = 'https://rickandmortyapi.com/api/character/';
let characters = [];

// Classes for characters and episodes parsing
class Character {
    constructor(id, name, image, species, status, type, gender, origin, location, episodeUrls, episodes) {
        this.id = id;
        this.name = name;
        this.image = image;
        this.species = species;
        this.status = status;
        this.type = type;
        this.gender = gender;
        this.origin = origin;
        this.location = location;
        this.episodeUrls = episodeUrls;
        this.episodes = episodes;
    }

    getPillColor() {
        if (this.status === "Alive") {
            return "text-bg-success";
        } else if (this.status === "Dead") {
            return "text-bg-danger";
        } else {
            return "text-bg-warning";
        }
    }

    static fromJSON(json) {
        return new Character(
            json.id,
            json.name,
            json.image,
            json.species,
            json.status,
            json.type,
            json.gender,
            json.origin.name,
            json.location.name,
            json.episode,
            null
        );
    }
}

class Episode {
    constructor(id, name, airDate, episode) {
        this.id = id;
        this.name = name;
        this.airDate = airDate;
        this.episode = episode;
    }

    static fromJSON(json) {
        return new Episode(json.id, json.name, json.air_date, json.episode);
    }
}

// Initial fetch
fetchCharacters(true);

// Functions
function fetchCharacters(forwardPage = false) {
    renderLoadingSpinner('Loading characters...');
    let url = (forwardPage ? nextPage : previousPage) ?? baseUrl;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            nextPage = data.info.next;
            previousPage = data.info.prev;
            characters = data.results.map(character => Character.fromJSON(character));
            renderCharacters();
        })
        .catch(error => {
            showError();
            console.log(error);
        });
}

function renderCharacters() {
    let table = `
    <div class="table-responsive">
        <table class="table table-striped text-center align-middle">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Species</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;
    characters.forEach(character => {
        table += `
        <tr>
            <td>
                <img class="img-fluid rounded-circle character-image" src="${character.image}" alt="${character.name}">
            </td>
            <td>
                <span class="custom-link" onclick=fetchCharacterDetails(${character.id})>
                    ${character.name}
                </span>
            </td>
            <td>${character.species}</td>
            <td>
                <span class="rounded-pill ${character.getPillColor()} px-3 py-2">
                    ${character.status}
                </span>
            </td>
        </tr>
        `;
    });
    table += '</tbody></table></div>';
    table += `
        <div class="row mb-3">
            <div class="col text-center">
                <div class="btn-group" role="group" aria-label="Pagination buttons">
                    <button type="button" class="btn" id="page-button" onclick=fetchCharacters(false) ${previousPage ? '' : 'disabled'}>
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <button type="button" class="btn" id="page-button" onclick=fetchCharacters(true) ${nextPage ? '' : 'disabled'}>
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('main').innerHTML = table;
}

async function fetchCharacterDetails(id) {
    renderLoadingSpinner('Loading character details...');
    let character = characters.find(character => character.id === id);
    if (!character.episodes) {
        await fetchEpisodes(character.episodeUrls)
            .then(episodes => character.episodes = episodes)
            .catch(error => {
                showError();
                console.log(error);
            });
    }
    renderCharacterDetail(character);
}

async function fetchEpisodes(episodeUrls) {
    let episodes = [];
    for (i in episodeUrls) {
        await fetch(episodeUrls[i])
            .then(response => response.json())
            .then(data => episodes.push(Episode.fromJSON(data)))
            .catch(error => {
                showError();
                console.log(error);
            });
    }
    return episodes;
}

function renderCharacterDetail(character) {
    let type = character.type ? `
        <div class="col-12 col-sm-6 col-md-12">
            <p><b>Type:</b> ${character.type} </p>
        </div>
    ` : '';
    let episodes = character.episodes ?
        character.episodes.map(episode => renderEpisodeCard(episode)).join('')
        : '';
    let detail = `
        <div class="col">
            <div class="row">
            <button class="btn btn-circle" onclick=renderCharacters()>
                <i class="fas fa-arrow-left"></i>
            </button>
            </div>
            <div class="row align-items-center">
                <div class="col-sm-12 col-md-6 text-center">
                    <img class="img-fluid rounded-circle" src="${character.image}" alt="${character.name}">
                </div>
                <div class="col-sm-12 col-md-6">
                    <div class="row justify-content-center">
                        <div class="col-12">
                            <h1>${character.name}</h1>
                        </div>
                        <div class="col-12 col-sm-6 col-md-12">
                            <p><b>Species:</b> ${character.species}</p>
                        </div>
                        <div class="col-12 col-sm-6 col-md-12">
                            <p>
                                <b>Status:</b>
                                <span class="rounded-pill ${character.getPillColor()} px-3 py-2">
                                    ${character.status}
                                </span>
                            </p>
                        </div>
                        ${type}
                        <div class="col-12 col-sm-6 col-md-12">
                            <p><b>Gender:</b> ${character.gender}</p>
                        </div>
                        <div class="col-12 col-sm-6 col-md-12">
                            <p><b>Origin:</b> ${character.origin}</p>
                        </div>
                        <div class="col-12 col-sm-6 col-md-12">
                            <p><b>Location:</b> ${character.location}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row justify-content-center">
                <h2 class="text-center m-3">Episodes</h2>
                ${episodes}
            </div>
        </div>
    `;
    document.getElementById('main').innerHTML = detail;
}

function renderEpisodeCard(episode) {
    return `
        <div class="col-sm-12 col-md-6 col-lg-3 mb-3">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${episode.name}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${episode.airDate}</h6>
                    <p class="card-text">${episode.episode}</p>
                </div>
            </div>
        </div>
    `;
}

// General functions
function renderLoadingSpinner(message) {
    document.getElementById('main').innerHTML = `
        <div class="d-flex justify-content-center">
            <p>${message}</p>
            <div class="spinner-border text-primary" role="status">
            </div>
        </div>
    `;
}

function showError() {
    document.getElementById('main').innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error!</strong> An error occurred while fetching data. Try again later.
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}