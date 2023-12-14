const Article = require('../models/articleModel')
const User = require('../models/userModel')
const fs = require('fs');

exports.getAllArticle = async (req, res, next) => {
    try {
        const data = await Article.find()
        res.status(200).json({
            status: "success",
            data: data
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            msg: err
        })
    }
    next();
}

exports.getArticle = async (req, res, next) => {
    try {
        const id = req.params.id;
        let data =
            await Article.findById(id)
        
        const user = await User.findById(data.ID_author);
        let article = { ...data }._doc;
        article.ID_author = user.FullName
        article.imageAuthor = user.Image_Avatar
        res.status(200).json({
            status: "success",
            data: article
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            msg: err
        })
    }
    next();
}

exports.createArticle = async (req, res, next) => {
    try {
        const newArticle = await Article.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                article: newArticle
            }
        })
    } catch (err) {
        res.status(400).json({
            status: "fail",
            msg: err
        })
    }
}

exports.createAllArticle = async (req, res, next) => {
    try {
        const filePath = `${__dirname}data\\article.json`.replace('controllers', '');
        const articles = JSON.parse(fs.readFileSync(filePath, 'utf-8')).article;

        for (const article of articles) {
            article.posted_time = new Date();
            await Article.create(article);
        }
        res.status(201).json({
            status: 'success'
        })
    } catch (err) {
        res.status(400).json({
            status: "fail",
            msg: err
        })
    }

}

exports.updateArticle = async (req, res, next) => {
    try {
        const id = req.params.id;
        const update = await Article.findByIdAndUpdate(id, req.body, {
            new: true
        })
        res.status(201).json({
            status: 'success',
            data: update
        })
    } catch (err) {
        res.status(500).send({
            status: "error",
            msg: err
        })
    }
    next();
}

exports.getTops = async (req, res, next) => {
    try {
        const name = req.params.name;
        let datas = '';
        const limit = req.query.limit || 12;
        console.log(limit)
        if (name == 'views') {
            datas = await Article.find({
                    view: {
                        $exists: true,
                        $gt: 0
                    }
                })
                .sort({
                    view: -1
                }).limit(limit);
        } else if (name == 'likes') {
            datas = await Article.find({
                likes: {
                    $exists: true
                }
            }).sort({
                likes: -1
            }).limit(limit);
        } else if (name == 'priority') {
            datas = await Article.find({
                isPriority: true
            }).limit(limit)
        } else if (name == 'timer') {
            datas = await Article.find().sort({
                posted_time: -1
            }).limit(limit)
        }
        // console.log(datas)/
        const result = await Promise.all(datas.map(async (data) => {
            const user = await User.findById(data.ID_author);
            // the cause is articles do not have attribute is imageAuthor then i must be parse them
            let aritcle = { ...data }._doc;
            aritcle.ID_author = user.FullName
            aritcle.imageAuthor = user.Image_Avatar
            return aritcle
        }))

        res.status(200).json({
            status: 'success',
            data: result
        })
    } catch (err) {
        res.status(500).send({
            status: "error",
            msg: err
        })
    }
    next();
}

exports.getCategory = async (req, res, next) => {
    try {
        const article = await Article.find({
            Category: {
                $in: [req.params.name]
            }
        }).exec();
        res.status(200).json({
            status: 'success',
            data: article
        })
    } catch (err) {
        res.status(500).send({
            status: "error",
            msg: err
        })
    }
    next();
}

exports.getPagination = async (req, res, next) => {
    const query = req.query
    const skip = (query.page - 1) * query.limit
    try {
        const dt = await Article.find({
                Category: {
                    $in: [query.category]
                }
            })
            .skip(skip)
            .limit(query.limit)
            .exec()
        res.status(200).json({
            status: 'success',
            data: dt
        })

    } catch (err) {
        res.status(500).send({
            status: "error",
            msg: err
        })
    }
    next();
}

// exports.deleteArticle = (req, res, next) => {
//     res.status(500).send({
//         status: "error",
//     })
//     next();
// }


exports.deleteArticle = async (req, res, next) => {
    try {

        const _id = req.params.id;

        // Find the user by ID and delete it
        const deletedArticle = await Article.deleteOne({
            _id
        });
        // const deletedUser = await Article.deleteMany();

        if (!deletedArticle) {
            // If the user with the specified ID is not found, return an error response
            return res.status(404).json({
                status: 'fail',
                msg: 'User not found.',
            });
        }


        res.status(201).json({
            status: 'success',
        })
    } catch (err) {
        res.status(400).json({
            status: "fail",
            msg: err
        })
    }
}


exports.SearchArticle = async (req, res, next) => {
    try {
        const tempsearchString = req.params.searchString;

        const searchString = tempsearchString.replace(/\+/g, ' ');

        console.log(searchString)


        const data = await Article.find({
            $or: [{
                    Title: {
                        $regex: searchString,
                        $options: 'i'
                    }
                }, // Search by Title
                {
                    Category: {
                        $in: [searchString]
                    }
                } // Search by Category
            ]
        });


        res.status(200).json({
            status: "success",
            data: data
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            msg: err
        })
    }
    next();
}


exports.addComment = async (req, res, next) => {
    try {
        const id_article = req.params.id;

        const find_Article = await Article.findById(id_article);

        // If the article with the specified ID is not found, return an error response
        if (!find_Article) {
            return res.status(404).json({
                status: 'fail',
                message: 'Article not found'
            });
        }

        const {
            id_user,
            content
        } = req.body;

        const newComment = {
            id_user: id_user,
            content: content
        };


        find_Article.comments.push(newComment);


        const update = await Article.findByIdAndUpdate(id_article, find_Article, {
            new: true
        })
        res.status(201).json({
            status: 'success',
            data: update
        })
    } catch (err) {
        res.status(500).send({
            status: "error",
            msg: err
        })
    }
    next();
}