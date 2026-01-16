let slideIndex = 0;
const slides = document.querySelectorAll('.slides');
const dots = document.querySelectorAll('.dot');

function showSlide(n) {
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    slideIndex = (n + slides.length) % slides.length;

    slides[slideIndex].classList.add('active');
    dots[slideIndex].classList.add('active');
}

function changeSlide(n) {
    showSlide(slideIndex + n);
}

function currentSlide(n) {
    showSlide(n);
}

setInterval(() => {
    changeSlide(1);
}, 5000);
