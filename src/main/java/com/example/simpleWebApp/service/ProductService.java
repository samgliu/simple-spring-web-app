package com.example.simpleWebApp.service;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.simpleWebApp.model.Product;
import com.example.simpleWebApp.repository.ProductRepo;

@Service
public class ProductService {

    @Autowired
    ProductRepo repo;

    // List<Product> products = new ArrayList<>(Arrays.asList(
    // new Product(101, "Iphone", 50000),
    // new Product(102, "Canon Camera", 70000),
    // new Product(103, "Hydroflask", 70)));

    public List<Product> getAllProducts() {
        return repo.findAll();
    }

    public Product getProductById(int prodId) {
        return repo.findById(prodId).orElse(null);
    }

    public Product addProduct(Product prod, MultipartFile imagFile) throws IOException {
        prod.setImageName(imagFile.getOriginalFilename());
        prod.setImageType(imagFile.getContentType());
        prod.setImageData(imagFile.getBytes());
        return repo.save(prod);
    }

    public Product updateProduct(int prodId, Product prod, MultipartFile imagFile) throws IOException {
        prod.setId(prodId);

        if (imagFile != null && !imagFile.isEmpty()) {
            prod.setImageName(imagFile.getOriginalFilename());
            prod.setImageType(imagFile.getContentType());
            prod.setImageData(imagFile.getBytes());
        } else {
            Product existing = getProductById(prodId);
            if (existing != null) {
                prod.setImageName(existing.getImageName());
                prod.setImageType(existing.getImageType());
                prod.setImageData(existing.getImageData());
            }
        }

        return repo.save(prod);
    }

    public void deleteProduct(int prodId) {
        repo.deleteById(prodId);
    }

    public List<Product> searchProducts(String keyword) {
        return repo.searchProducts(keyword);
    }

}
