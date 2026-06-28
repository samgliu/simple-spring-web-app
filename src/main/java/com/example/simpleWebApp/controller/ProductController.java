package com.example.simpleWebApp.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.simpleWebApp.model.Product;
import com.example.simpleWebApp.service.ProductService;

@RestController
@CrossOrigin
@RequestMapping("/api")
public class ProductController {

    @Autowired
    ProductService service;

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAllProducts() {
        return new ResponseEntity<>(service.getAllProducts(), HttpStatus.OK);
    }

    @GetMapping("/products/{prodId}")
    public ResponseEntity<Product> geProduct(@PathVariable int prodId) {
        Product product = service.getProductById(prodId);
        if (product == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(product, HttpStatus.OK);
    }

    @GetMapping("/products/{prodId}/image")
    public ResponseEntity<byte[]> geProductImage(@PathVariable int prodId) {
        Product product = service.getProductById(prodId);
        if (product == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        byte[] imageFile = product.getImageData();

        return ResponseEntity.ok()
                .contentType(MediaType.valueOf(product.getImageType())).body(imageFile);

    }

    @PostMapping("/products")
    public ResponseEntity<?> addProduct(@RequestPart Product prod, @RequestPart MultipartFile imageFile) {
        try {
            Product product = service.addProduct(prod, imageFile);
            return new ResponseEntity<>(product, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/products/{prodId}")
    public ResponseEntity<String> updateProduct(@PathVariable int prodId, @RequestPart Product prod,
            @RequestPart(required = false) MultipartFile imageFile) {
        try {
            service.updateProduct(prodId, prod, imageFile);
            return new ResponseEntity<>("Succeeded.", HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }

    }

    @DeleteMapping("/products/{prodId}")
    public ResponseEntity<String> deleteProduct(@PathVariable int prodId) {
        Product product = service.getProductById(prodId);
        if (product == null) {
            return new ResponseEntity<>("Not Found", HttpStatus.NOT_FOUND);
        }
        service.deleteProduct(prodId);
        return new ResponseEntity<>("Deleted", HttpStatus.OK);

    }
}
