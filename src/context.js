import React, { Component } from 'react'
import {storeProducts,detailProduct} from './data';
import client from './Contentful';

const ProductContext = React.createContext();
//Prodivder

//Consumer
 class ProductProvider extends Component {
   constructor(props){
     super(props);
     this.state = {
       products:[],
       detailProduct: detailProduct,
       cart:[],
       modalOpen:false,
       modalProduct:detailProduct,
       cartSubTotal:0,
       cartTax:0,
       cartTotal:0
     }
     this.handleDetail = this.handleDetail.bind(this);
     this.addToCart = this.addToCart.bind(this);
     this.setProducts = this.setProducts.bind(this);
     this.getItem = this.getItem.bind(this);
     this.openModal = this.openModal.bind(this);
     this.closeModal = this.closeModal.bind(this);
     this.increment = this.increment.bind(this);
     this.decrement = this.decrement.bind(this);
     this.removeItem = this.removeItem.bind(this);
     this.clearCart = this.clearCart.bind(this);
     this.addTotals = this.addTotals.bind(this);
   }
   //getData
   setData = async () =>{
     try {
       let response = await client.getEntries({
        content_type: process.env.REACT_APP_CONTENT_TYPE_ID,
        select: 'sys.id,fields.title,fields.price,fields.img,fields.info,fields.inCart,fields.count,fields.total,fields.company'
      });
      const data = response.items.map(item => {
        const {title, price,company,info,inCart,count,total,img} = item.fields;
        return {id:item.sys.id,title,company,info,price,inCart,count,total,img:img.fields.file.url}
      });
      this.setState(() => {
        return {products: data} 
      })

     } catch (error) {
       console.log(error);
     }
   }
   componentDidMount(){
    //this.setProducts();
    this.setData();
   }
   setProducts(){
     let tempProducts =[];
     storeProducts.forEach(item =>{
       const singleItem = {...item};
       tempProducts = [...tempProducts,singleItem];
     })

     this.setState(() => {
       return {products: JSON.parse(JSON.stringify(storeProducts))} //Deep clone storeProducts
     })
   }
   getItem(id){
    const product = this.state.products.find(item => item.id === id);
    return product;
   }

   handleDetail(id) {
     const product = this.getItem(id);
     this.setState(() => {
       return{detailProduct:product}
     })
   }
   addToCart(id){
     let tempProducts = [...this.state.products];
     const index = tempProducts.indexOf(this.getItem(id));
     const product = tempProducts[index];
     product.inCart = true;
     product.count = 1;
     const price = product.price;
     product.total = price;
     this.setState(() => {
       return{products:tempProducts, cart:[...this.state.cart, product]}
     }, () => {this.addTotals()})
   }
   openModal(id){
    const product = this.getItem(id);
    this.setState(() => {
      return {modalProduct:product, modalOpen:true}
    })
   }
   closeModal(){
    this.setState(() => {
      return{modalOpen:false}
    })
   }
   increment(id){
     let tempCart = [...this.state.cart];
     const selectedProduct = tempCart.find(item => item.id === id);
     const index = tempCart.indexOf(selectedProduct);
     const product = tempCart[index];
     product.count +=1;
     product.total = product.price * product.count;
     this.setState(() => {return{cart:[...tempCart]}},() => {this.addTotals()})
   }
   decrement(id){
    let tempCart = [...this.state.cart];
    const selectedProduct = tempCart.find(item => item.id === id);
    const index = tempCart.indexOf(selectedProduct);
    const product = tempCart[index];
    product.count -=1;
    if(product.count === 0){
      this.removeItem(id);
    }else{
      product.total = product.price * product.count;
      this.setState(() => {return{cart:[...tempCart]}},() => {this.addTotals()})

    }
  }
  removeItem(id){
    let tempProducts = [...this.state.products];
    let tempCart = [...this.state.cart];
    tempCart = tempCart.filter(item => item.id !== id);

    const index = tempProducts.indexOf(this.getItem(id));
    let removeProduct = tempProducts[index];
    removeProduct.inCart = false;
    removeProduct.count = 0;
    removeProduct.total = 0;
    this.setState(() => {
      return {cart:[...tempCart],products:[...tempProducts]}
    },() => {
      this.addTotals();
    })
  }
  clearCart(){
    this.setState(() => {
      return{cart:[]}
    }, () => {
      this.setProducts();
      this.addTotals();
    });
  }
  addTotals(){
    let subTotal = 0;
    this.state.cart.map((item) => (subTotal += item.total));
    const tempTax = subTotal * 0.1;
    const tax = parseFloat(tempTax.toFixed(2));
    const total = subTotal + tax;
    this.setState(() =>{
      return{cartSubTotal:subTotal, cartTax:tax, cartTotal:total}
    })
  }
  render() {
    return (
      <ProductContext.Provider value={{
        ...this.state,
        handleDetail: this.handleDetail,
        addToCart: this.addToCart,
        openModal: this.openModal,
        closeModal: this.closeModal,
        increment: this.increment,
        decrement: this.decrement,
        removeItem: this.removeItem,
        clearCart: this.clearCart
      }}>
        {this.props.children}
      </ProductContext.Provider>
    )
  }
}


const ProductConsumer = ProductContext.Consumer;
export {ProductProvider, ProductConsumer};