// const { $where } = require("../../../../models/bannerModel");
const { response } = require("../../../routers/userRoute");

function addCart(id,user) {
  function showAlertBox(){
    $("#cartAlert").fadeIn();

    //Hide the Alert Box after 3 seconds
    setTimeout(function(){
      $('#cartAlert').fadeOut();
    },3000)

  }

  function showAlertBoxAlready() {
    $("#cartAlertAlready").fadeIn()
 

  //Hide the Alert box Already after 3 seconds
  setTimeout(function(){
    $('#cartAlertAlready').fadeOut()
  },3000)
}


  if(user){
    $.ajax({
      url: '/addToCart',
      method: "post",
      data: {id:id,user:user},
      success: function (response){
        if(response.cart==1){
        showAlertBox()
      }
      if(response.cart==2){
        showAlertBoxAlready()
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