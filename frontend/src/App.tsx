import { FormEvent, useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  desc: string;
  brand: string;
  price: number;
  category: string;
  releaseDate: string;
  available: boolean;
  quantity: number;
  imageName?: string;
  imageType?: string;
  imageData?: string;
};

type ProductForm = Omit<Product, "id" | "price" | "quantity"> & {
  id: string;
  price: string;
  quantity: string;
};

type ModalMode = "add" | "edit" | "details" | null;

const emptyForm: ProductForm = {
  id: "",
  name: "",
  desc: "",
  brand: "",
  price: "",
  category: "",
  releaseDate: "",
  available: true,
  quantity: "",
};

function toForm(product: Product): ProductForm {
  return {
    ...product,
    id: String(product.id),
    price: String(product.price),
    quantity: String(product.quantity),
    releaseDate: toDateInputValue(product.releaseDate),
  };
}

function toProduct(form: ProductForm): Product {
  return {
    ...form,
    id: Number(form.id),
    price: Number(form.price),
    quantity: Number(form.quantity),
    releaseDate: toApiDateValue(form.releaseDate),
  };
}

function toDateInputValue(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return "";
  }

  return `${match[3]}-${match[1]}-${match[2]}`;
}

function toApiDateValue(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return value;
  }

  return `${match[2]}/${match[3]}/${match[1]}`;
}

function getImageSrc(product: Product): string | null {
  if (!product.imageData) {
    return null;
  }

  return `data:${product.imageType ?? "image/jpeg"};base64,${product.imageData}`;
}

function getProductImageUrl(productId: number, version: number): string {
  return `/api/products/${productId}/image?v=${version}`;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsImageFailed, setDetailsImageFailed] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [imageVersion, setImageVersion] = useState(Date.now());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");
      setProducts(await request<Product[]>("/api/products"));
      setImageVersion(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load products");
    } finally {
      setLoading(false);
    }
  }

  async function searchProducts(keyword: string) {
    try {
      setLoading(true);
      setError("");
      setProducts(await request<Product[]>(`/api/products/search?keyword=${encodeURIComponent(keyword)}`));
      setImageVersion(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not search products");
    } finally {
      setLoading(false);
    }
  }

  function refreshProducts() {
    const keyword = query.trim();

    if (keyword) {
      searchProducts(keyword);
    } else {
      loadProducts();
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const keyword = query.trim();

      if (keyword) {
        searchProducts(keyword);
      } else {
        loadProducts();
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  function updateField<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm(toForm(product));
    setImageFile(null);
    setModalMode("edit");
  }

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setSelectedProduct(null);
    setDetailsImageFailed(false);
    setModalMode("add");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setModalMode(null);
  }

  function closeModal() {
    setModalMode(null);
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setSelectedProduct(null);
    setDetailsImageFailed(false);
  }

  async function showProductDetails(productId: number) {
    try {
      setDetailLoading(true);
      setError("");
      setDetailsImageFailed(false);
      setSelectedProduct(await request<Product>(`/api/products/${productId}`));
      setImageVersion(Date.now());
      setModalMode("details");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load product details");
    } finally {
      setDetailLoading(false);
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const productBody = new FormData();
      productBody.append("prod", new Blob([JSON.stringify(toProduct(form))], { type: "application/json" }));

      if (imageFile) {
        productBody.append("imageFile", imageFile);
      }

      if (editingId === null) {
        if (!imageFile) {
          throw new Error("Please choose a product image");
        }

        await fetch("/api/products", {
          method: "POST",
          body: productBody,
        }).then((response) => {
          if (!response.ok) {
            throw new Error(`Request failed with ${response.status}`);
          }
        });
      } else {
        await fetch(`/api/products/${editingId}`, {
          method: "PUT",
          body: productBody,
        }).then((response) => {
          if (!response.ok) {
            throw new Error(`Request failed with ${response.status}`);
          }
        });
      }

      resetForm();
      setImageVersion(Date.now());
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save product");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(productId: number) {
    try {
      setError("");
      await fetch(`/api/products/${productId}`, { method: "DELETE" }).then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`);
        }
      });
      setImageVersion(Date.now());
      await loadProducts();

      if (editingId === productId) {
        resetForm();
      }

      if (selectedProduct?.id === productId) {
        setSelectedProduct(null);
        setModalMode(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete product");
    }
  }

  return (
    <main>
      <header className="app-header">
        <div>
          <p className="eyebrow">Spring Boot practice UI</p>
          <h1>Product Catalog</h1>
        </div>
        <div className="header-actions">
          <button onClick={startAdd} type="button">
            Add Product
          </button>
          <button className="secondary" onClick={refreshProducts} type="button">
            Refresh
          </button>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <section className="layout full">
        <section className="catalog">
          <div className="catalog-tools">
            <div>
              <h2>Products</h2>
              <p>{products.length} total</p>
            </div>
            <input
              aria-label="Search products"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, brand, category"
              value={query}
            />
          </div>

          {loading ? (
            <div className="empty">Loading products...</div>
          ) : detailLoading ? (
            <div className="empty">Loading product details...</div>
          ) : products.length === 0 ? (
            <div className="empty">No products found.</div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <article
                  className="product-card clickable"
                  key={product.id}
                  onClick={() => showProductDetails(product.id)}
                >
                  {getImageSrc(product) ? (
                    <img className="product-image" src={getImageSrc(product)!} alt={product.name} />
                  ) : (
                    <div className="product-image placeholder">No image</div>
                  )}
                  <div className="card-topline">
                    <span>{product.brand}</span>
                    <span className={product.available ? "pill active" : "pill"}>
                      {product.available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  <h3>{product.name}</h3>
                  <p>{product.desc}</p>
                  <div className="meta">
                    <strong>${Number(product.price).toFixed(2)}</strong>
                    <span>{product.quantity} in stock</span>
                    <span>{product.category}</span>
                  </div>
                  <div className="actions">
                    <button
                      className="secondary"
                      onClick={(event) => {
                        event.stopPropagation();
                        startEdit(product);
                      }}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="danger"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteProduct(product.id);
                      }}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      {(modalMode === "add" || modalMode === "edit") && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <form
            aria-modal="true"
            className="modal editor"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={saveProduct}
            role="dialog"
          >
            <div className="section-heading">
              <h2>{editingId === null ? "Add Product" : "Edit Product"}</h2>
              <button className="link-button" onClick={closeModal} type="button">
                Close
              </button>
            </div>

            <label>
              ID
              <input
                min="1"
                onChange={(event) => updateField("id", event.target.value)}
                required
                type="number"
                value={form.id}
              />
            </label>

            <label>
              Name
              <input
                onChange={(event) => updateField("name", event.target.value)}
                required
                value={form.name}
              />
            </label>

            <label>
              Description
              <textarea
                onChange={(event) => updateField("desc", event.target.value)}
                required
                rows={3}
                value={form.desc}
              />
            </label>

            <div className="field-row">
              <label>
                Brand
                <input
                  onChange={(event) => updateField("brand", event.target.value)}
                  required
                  value={form.brand}
                />
              </label>
              <label>
                Category
                <input
                  onChange={(event) => updateField("category", event.target.value)}
                  required
                  value={form.category}
                />
              </label>
            </div>

            <div className="field-row">
              <label>
                Price
                <input
                  min="0"
                  onChange={(event) => updateField("price", event.target.value)}
                  required
                  step="0.01"
                  type="number"
                  value={form.price}
                />
              </label>
              <label>
                Quantity
                <input
                  min="0"
                  onChange={(event) => updateField("quantity", event.target.value)}
                  required
                  type="number"
                  value={form.quantity}
                />
              </label>
            </div>

            <label>
              Release Date
              <input
                onChange={(event) => updateField("releaseDate", event.target.value)}
                required
                type="date"
                value={form.releaseDate}
              />
            </label>

            <label className="checkbox">
              <input
                checked={form.available}
                onChange={(event) => updateField("available", event.target.checked)}
                type="checkbox"
              />
              Available for sale
            </label>

            <label>
              Product Image
              <input
                accept="image/*"
                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                required={modalMode === "add"}
                type="file"
              />
            </label>

            {modalMode === "edit" && form.imageName && (
              <p className="form-note">Current image: {form.imageName}</p>
            )}

            <button disabled={saving} type="submit">
              {saving ? "Saving..." : editingId === null ? "Add Product" : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {modalMode === "details" && selectedProduct && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <aside
            aria-modal="true"
            className="modal details-panel"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="section-heading">
              <h2>Product Details</h2>
              <button className="link-button" onClick={closeModal} type="button">
                Close
              </button>
            </div>
            <div>
              {!detailsImageFailed ? (
                <img
                  className="details-image"
                  src={getProductImageUrl(selectedProduct.id, imageVersion)}
                  alt={selectedProduct.name}
                  onError={() => setDetailsImageFailed(true)}
                />
              ) : (
                <div className="details-image placeholder">No image</div>
              )}
              <p className="eyebrow">{selectedProduct.brand}</p>
              <h2>{selectedProduct.name}</h2>
              <p>{selectedProduct.desc}</p>
            </div>
            <dl>
              <div>
                <dt>ID</dt>
                <dd>{selectedProduct.id}</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>${Number(selectedProduct.price).toFixed(2)}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{selectedProduct.category}</dd>
              </div>
              <div>
                <dt>Release Date</dt>
                <dd>{selectedProduct.releaseDate}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{selectedProduct.available ? "Available" : "Unavailable"}</dd>
              </div>
              <div>
                <dt>Quantity</dt>
                <dd>{selectedProduct.quantity}</dd>
              </div>
              <div>
                <dt>Image</dt>
                <dd>{selectedProduct.imageName ?? "No image"}</dd>
              </div>
            </dl>
            <div className="actions">
              <button className="secondary" onClick={() => startEdit(selectedProduct)} type="button">
                Edit
              </button>
              <button className="danger" onClick={() => deleteProduct(selectedProduct.id)} type="button">
                Delete
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
