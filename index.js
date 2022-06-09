const jwtSecret   = 'CbymrfGfnB'

const express = require('express');
const express_graphql = require('express-graphql');

const { buildSchema, printSchema } = require('graphql');
const expand = require('./expand')

;(async () => {

    const {Savable, slice, getModels} = await require('./models.js')()
    const jwtGQL = require('./jwt').jwtGQL

    const {anonSchema, anonResolvers} = require('./anon')({Savable, secret: jwtSecret})

    let schema = buildSchema(`
        type User {
             _id: String
             createdAt: String
             login: String
             nick : String
             orders: [Order]
        }

        input UserInput {
             _id: String
             login: String
             nick : String
        }

        type Category {
            _id: ID,
            createdAt: String
            name: String!,
            goods: [Good]
        }
        input CategoryInput {
            _id: ID,
            name: String,
            goods: [GoodInput]
        }

        type Good {
            _id: ID,
            createdAt: String
            name: String!,
            description: String
            price: Float
            imgUrls: [String]
            orderGoods: [OrderGood]
            categories: [Category]
        }

        input GoodInput {
            _id: ID,
            name: String,
            description: String
            imgUrls: [String]
            price: Float
            categories: [CategoryInput]
        }


        type OrderGood {
            _id: ID,
            createdAt: String
            price: Float,
            count: Float,
            good: Good,
            order: Order
            total: Float
        }

        input OrderGoodInput {
            _id: ID,
            count: Int,
            good: GoodInput,
            order: OrderInput
        }


        type Order {
            _id: ID
            createdAt: String
            orderGoods: [OrderGood]
            total: Float
        }

        input OrderInput {
            _id: ID
            orderGoods: [OrderGoodInput]
        }

    `);

    schema = expand(schema)
    console.log(printSchema(schema))

    const app = express();
    app.use(express.static('public'));
    app.use('/graphql', express_graphql(jwtGQL({anonSchema, anonResolvers, schema, createContext: getModels, graphiql: true, secret: jwtSecret})))
    app.listen(4000, () => console.log('Express GraphQL Server Now Running On localhost:4000/graphql'));
})()
