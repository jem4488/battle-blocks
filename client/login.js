function login(name) {
   var name = $('#name').val();
   console.log(name);
   sessionStorage.setItem('name', name);
   window.location.href = '/lobby?name=' + name;
};