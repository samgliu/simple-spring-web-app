package com.example.simpleWebApp.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.simpleWebApp.model.Product;

@Service
public class ProductService {

    List<Product> products = new ArrayList<>(Arrays.asList(
            new Product(101, "Iphone", 50000),
            new Product(102, "Canon Camera", 70000),
            new Product(103, "Hydroflask", 70)));

    public List<Product> getProducts() {
        return products;
    }

    public Product getProductById(int prodId) {
        return products.stream()
                .filter(p -> p.getProdId() == prodId)
                .findFirst().get();
    }

    public void addProduct(Product prod) {
        products.add(prod);
    }

    public void updateProduct(Product prod) {
        int index = 0;
        for (int i = 0; i < products.size(); i++) {
            if (products.get(i).getProdId() == prod.getProdId()) {
                index = i;
                break;
            }
        }
        products.set(index, prod);
    }

    public void deleteProduct(int prodId) {
        int index = 0;
        for (int i = 0; i < products.size(); i++) {
            if (products.get(i).getProdId() == prodId) {
                index = i;
                break;
            }
        }
        products.remove(index);
    }

}
