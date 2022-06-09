const ObjectID    = require("mongodb").ObjectID;
const {connect}   = require('mm')

module.exports = async (dbName='shop') => {
    const {Savable, slice} = await connect(dbName)

    async function getModels({id}){
        const SlicedSavable = slice([id, 'user', 'admin'])

        class User extends SlicedSavable {
            constructor(...params){
                super(...params)
                this.orders = this.orders instanceof Array ? this.orders : (this.orders ? [this.orders] : []) 
            }

            static get relations(){
                return {
                    orders: "user"
                }
            }
        }
        SlicedSavable.addClass(User)

        class Good extends SlicedSavable {
            constructor(...params){
                super(...params)
                this.categories = this.categories instanceof Array ? this.categories : (this.categories ? [this.categories] : []) 
                this.orderGoods = this.orderGoods instanceof Array ? this.orderGoods : (this.orderGoods ? [this.orderGoods] : []) 
            }

            static get relations(){
                return {
                    categories: ["goods"],
                    orderGoods: "good",
                }
            }
        }
        SlicedSavable.addClass(Good)

        class Category extends SlicedSavable {
            constructor(...params){
                super(...params)
                this.goods = this.goods instanceof Array ? this.goods : (this.goods ? [this.goods] : []) 
            }

            static get relations(){
                return {
                    goods: ["categories"],
                }
            }
        }
        SlicedSavable.addClass(Category)

        class Order extends SlicedSavable {
            constructor(...params){
                super(...params)
                this.orderGoods = Savable.arrize(this.orderGoods)
            }

            get total(){
                return (async() => (await Promise.all(this.orderGoods)).reduce((a,b) => (a.total || a) + b.total, 0))()
            }

            static get relations(){
                return {
                    user: ["orders"],
                    orderGoods: "order"
                }
            }
        }
        SlicedSavable.addClass(Order)

        class OrderGood extends SlicedSavable {
            constructor(...params){
                super(...params)
            }

            get total(){
                return this.price*this.count
            }

            static get relations(){
                return {
                    good: ["orderGoods"],
                    order: ["orderGoods"]
                }
            }
        }
        SlicedSavable.addClass(OrderGood)

        const thisUser = await Savable.m.User.findOne({_id: ObjectID(id)})

        return {models: {
                            SlicedSavable, User, Good, Category, Order, OrderGood
                        }, 
                thisUser}
    }

    return {
        Savable, 
        slice,
        getModels
    }
}

