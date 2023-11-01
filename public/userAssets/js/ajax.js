// const { $where } = require("../../../../models/bannerModel");
// const { response } = require("../../../routers/userRoute");


// ===== add to cart =========
function addCart(id,user) {


  if(user){
    $.ajax({
      url: '/addToCart',
      method: "post",
      data: {id:id,user:user},
      success: function (response){
        if(response.cart==1){
          Swal.fire({
            // position: 'top-end',
            icon: 'success',
            showConfirmButton: false,
            timer: 1500
          })
          
      }
      if(response.cart==2){
        swal("This Product is Already in Your Cart");

      }
      },
      error:function(error){
        console.log("Error",error);
      }
      
    });
  }else{
    window.location.href= '/login'
  }

}


// ========== removing cart items ========
function removeCartItem(user,product,qty){
  console.log('button clicked');
  // console.log(user,product,qty);
  $.ajax({
      url:'/removeCart',
      method:'delete',
      encoded:true,
      data:{user,product,qty},
      success:(response)=>{
          console.log(response);
          if(response.remove==1){
            Swal.fire({
              
              title: 'Success!',
              text: 'item removed from cart!',
              icon: 'success',
              timer:2000,
              
             
            }).then(() => {
              location.reload();
            });
          }
      }
  })
}


// ======= deleting user address ========
function removeAddress(id){
  console.log(id);
  $.ajax({
      url: '/deleteAddress',
      method: 'delete',
      data: { id },
      success: (response) => {
          console.log(response)
          if (response.remove == 1) {
            Swal.fire({
              
              title: 'Success!',
              text: 'address removed!',
              icon: 'success',
              timer:2000
             
            }).then(() => {
              location.reload();
            });
          }
      }
  });
}

// ======= deleting user address ========
// function removeAddress(id) {
//     console.log(id);
//     axios.delete('/deleteAddress', { data: { id } })
//         .then(response => {
//             console.log(response.data);
//             if (response.data.remove === 1) {
//                 location.reload();
//             }
//         })
//         .catch(error => {
//             console.error('Error:', error);
//         });
// }



// function addCart(id, user) {
//   if (user) {
//       fetch('/addToCart', {
//           method: 'POST',
//           body: JSON.stringify({ id: id, user: user }),
//           headers: {
//               'Content-Type': 'application/json'
//           }
//       })
//       .then(response => response.json())
//       .then(data => {
//           // Handle the response data here
//       })
//       .catch(error => {
//           console.error('Error:', error);
//       });
//   } else {
//       window.location.href = '/login';
//   }
// }



// function removeCartItem(user, product, qty) {
//   console.log('Button clicked');
//   fetch('/removeCart', {
//       method: 'DELETE',
//       headers: {
//           'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({ user, product, qty })
//   })
//   .then(response => {
//       if (response.ok) {
//           return response.json();
//       }
//       throw new Error('Failed to delete item');
//   })
//   .then(data => {
//       alert('Item deleted!');
//       window.location.reload(); // Reload the page after the alert is shown
//   })
//   .catch(error => {
//       alert(error.message);
//   });
// }