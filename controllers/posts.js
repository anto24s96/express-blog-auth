//importazione moduli necessari
const path = require("path");
const fs = require("fs");
const slugify = require("slugify");
let posts = require("../db/postsDB.json");
const { writeJSON } = require("../utils.js");

//Funzione di scrittura nel file json
const updatePosts = (newPosts) => {
    writeJSON("postsDB", newPosts);
    posts = newPosts;
};

//funzione per eliminare i files pubblici
const deletePublicFile = (fileName) => {
    const filePath = path.join(__dirname, "../public", fileName);
    fs.unlinkSync(filePath);
};

//funzione per scaricare le immagini inserendo nell'url lo slug
const downloadImage = (req, res) => {
    //recupero lo slug dei post
    const { slug: postSlug } = req.params;
    const post = posts.find((post) => post.slug === postSlug);

    //controllo se il post o l'immagine del post non esistono
    if (!post || !post.image) {
        return res.status(404).json({
            error: "Not Found",
            description: post ? "Image not found" : `Post with slug: ${postSlug} does not exist`,
        });
    }

    //costruisco il percorso del file per il download
    const filePath = path.join(__dirname, `../public/${post.image}`);

    //Invio il file per il download
    res.download(filePath, (err) => {
        if (err) {
            return res.status(404).json({
                error: "Not Found",
                description: "Image could not be downloaded",
            });
        }
    });
};

//funzione per creare uno slug utilizzando il titolo dei post
const createSlug = (title) => {
    const baseSlug = slugify(title, {
        replacement: "-",
        lower: true,
        locale: "it",
        trim: true,
    });
    const slugs = posts.map((p) => p.slug);
    let slug = baseSlug;
    let counter = 1;

    while (slugs.includes(slug)) {
        slug = `${baseSlug}-${counter++}`;
    }

    return slug;
};

const index = (req, res) => {
    res.format({
        html: () => {
            let html = `
                <main style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <a href="/"><button>Home</button></a>
                    ${posts
                        .map(
                            ({ title, content, image, tags, slug }) => `
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h2>${title}</h2>
                            <img width="350" src="/${image}" alt="${title}" />
                            <p style="padding: 0 200px">${content}</p>
                            <p>${tags.map((tag) => `<span>#${tag}</span>`).join(" ")}</p>
                             <a href="/posts/${slug}"><button>Details</button></a>
                        </div>
                    `
                        )
                        .join("")}
                </main>
            `;
            res.send(html);
        },
        json: () => {
            res.json(posts);
        },
    });
};

const show = (req, res) => {
    //recupero lo slug dei post
    const { slug: postSlug } = req.params;
    const post = posts.find((post) => post.slug === postSlug);

    //controllo se il post con lo slug cercato esiste, altrimenti mostro un messaggio di errore
    if (post) {
        const { title, content, image, tags } = post;

        //costruisco l'URL per il download dell'immagine dei post
        post.img_download_url = `${req.protocol}://${req.headers.host}/posts/${post.slug}/download`;

        res.format({
            html: () => {
                let html = `
                    <main style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <div style="text-align: center;">
                            <h2>${title}</h2>
                            <img width="350" src="/${image}" alt="${title}" />
                            <p>${content}</p>
                            <p>${tags.map((tag) => `<span>#${tag}</span>`).join(" ")}</p>
                            <div>
                                <a href="/posts"><button>Back</button></a>
                                <a href="${post.img_download_url}"><button>Download Image</button></a>
                            </div>
                        </div>
                    </main>
                `;
                res.send(html);
            },
            json: () => {
                res.json({
                    ...post,
                    image_url: `http://${req.headers.host}/${image}`,
                });
            },
        });
    } else {
        res.status(404).send(`No post exists with the slug "${postSlug}"`);
    }
};

const store = (req, res) => {
    if (req.is("application/x-www-form-urlencoded") || req.is("multipart/form-data")) {
        const { title, content, tags } = req.body;

        if (!title || !content || !tags) {
            req.file?.filename && deletePublicFile(req.file.filename);
            return res.status(400).send("Some data is missing");
        }
        if (!req.file || !req.file.mimetype.includes("image")) {
            req.file?.filename && deletePublicFile(req.file.filename);
            return res.status(400).send("Image is missing or it is not an image file");
        }

        let newPost = {
            title,
            slug: createSlug(title),
            content,
            image: req.file.filename,
            tags,
        };

        updatePosts([...posts, newPost]);

        res.format({
            html: () => {
                res.redirect("/posts");
            },
            json: () => {
                res.json({
                    data: newPost,
                });
            },
            // risposta per tutti i formati che non vengono gestiti
            default: () => {
                res.status(406).send("Unacceptable Format");
            },
        });
    } else {
        res.status(415).send("Content-Type Not Acceptable");
    }
};

const destroy = (req, res) => {
    // Estrae il parametro 'slug' dall'URL della richiesta
    const { slug } = req.params;

    // Trovo il post con lo 'slug' corrispondente nell'array 'posts'
    const postToDelete = posts.find((p) => p.slug === slug);

    // Verifica se il post esiste
    if (!postToDelete) {
        // Se il post non viene trovato, restituisce uno stato 404 con un messaggio appropriato
        return res.format({
            html: () => res.status(404).send(`No post found with slug ${slug}`),
            json: () => res.status(404).json({ error: `Post not found with slug: ${slug}` }),
        });
    }

    try {
        // Tento di eliminare l'immagine associata al post
        deletePublicFile(postToDelete.image);
    } catch (error) {
        return res.status(500).json({ error: "Error during image deletion" });
    }

    // Aggiorno l'array dei post per rimuovere il post eliminato
    updatePosts(posts.filter((p) => p.slug !== slug));

    // Invio una risposta di successo che indica che il post è stato eliminato
    res.format({
        html: () => res.send(`The post with slug: ${slug} was successfully deleted`),
        json: () => res.json({ message: `Post with slug ${slug} successfully deleted` }),
    });
};

module.exports = {
    index,
    show,
    store,
    destroy,
    downloadImage,
};
