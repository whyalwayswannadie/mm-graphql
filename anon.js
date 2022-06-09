const { buildSchema } = require('graphql');
const jwt             = require('jsonwebtoken')
const { createHash }  = require('crypto')

const salt            = "IF384"

module.exports = ({Savable, secret}) => {
    class User extends Savable {
        async getACL(){
            return [this._id.toString(), "user"]
        }

        set password(pwd){
            this._password = User.getHash(pwd)
        }

        static getHash(pwd){
            return createHash('sha256').update(pwd).update(salt).digest('hex')
        }
    }
    Savable.addClass(User)

    const anonResolvers = {
        createUser:async function ({login, password}){
            let user =  await Savable.m.User.findOne({login, password})
            if (user)
                return null;
            user = await (new User({login, password})).save()

            user.___owner = user._id.toString()
            user.___permissions = {
                read: ["owner", "user"]
            }

            return await user.save()
        },

        async login({login, password}){
            const user =  await Savable.m.User.findOne({login, _password: User.getHash(password)})
            if (!user)
                return null;

            const token = jwt.sign({ sub: {id: user._id, login, acl: await user.getACL()}}, secret); //подписывам токен нашим ключем
            return token
        },

        changePassword:async function ({login, password, newPassword}){
            const user =  await Savable.m.User.findOne({login, _password: User.getHash(password)})
            if (!user) return null;
            user.password = newPassword;
            return await user.save()
        },
    }

    const anonSchema = buildSchema(`
        type Query {
            login(login: String!, password: String!): String
        }
        type Mutation {
            createUser(login: String!, password: String!): User
            changePassword(login: String!, password: String!, newPassword: String!): User
        }

        type User {
             _id: String
             createdAt: String
             login: String
             nick : String
        }
    `)
    return {anonResolvers, anonSchema}
}
