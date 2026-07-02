package com.hh.finance.service;

import com.hh.finance.domain.Brand;
import com.hh.finance.domain.InventoryBalance;
import com.hh.finance.domain.InventoryMovement;
import com.hh.finance.domain.NfeEntry;
import com.hh.finance.domain.NfeItem;
import com.hh.finance.domain.Product;
import com.hh.finance.domain.Sale;
import com.hh.finance.domain.User;
import com.hh.finance.dto.LojappDtos.BrandDashboardResponse;
import com.hh.finance.dto.LojappDtos.BrandKpiResponse;
import com.hh.finance.dto.LojappDtos.BrandRequest;
import com.hh.finance.dto.LojappDtos.BrandResponse;
import com.hh.finance.dto.LojappDtos.LowStockResponse;
import com.hh.finance.dto.LojappDtos.NfeImportResponse;
import com.hh.finance.dto.LojappDtos.ProductRequest;
import com.hh.finance.dto.LojappDtos.ProductResponse;
import com.hh.finance.dto.LojappDtos.SaleRequest;
import com.hh.finance.dto.LojappDtos.StockAdjustmentRequest;
import com.hh.finance.repository.BrandRepository;
import com.hh.finance.repository.InventoryBalanceRepository;
import com.hh.finance.repository.InventoryMovementRepository;
import com.hh.finance.repository.NfeEntryRepository;
import com.hh.finance.repository.NfeItemRepository;
import com.hh.finance.repository.ProductRepository;
import com.hh.finance.repository.SaleRepository;
import com.hh.finance.repository.UserRepository;
import java.io.StringReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import javax.xml.parsers.DocumentBuilderFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

@Service
public class LojappCoreService {

    private static final String FALLBACK_BRAND_NAME = "Nao informada";
    private final BrandRepository brands;
    private final ProductRepository products;
    private final UserRepository users;
    private final NfeEntryRepository nfeEntries;
    private final NfeItemRepository nfeItems;
    private final InventoryMovementRepository inventoryMovements;
    private final InventoryBalanceRepository inventoryBalances;
    private final SaleRepository sales;

    public LojappCoreService(
            BrandRepository brands,
            ProductRepository products,
            UserRepository users,
            NfeEntryRepository nfeEntries,
            NfeItemRepository nfeItems,
            InventoryMovementRepository inventoryMovements,
            InventoryBalanceRepository inventoryBalances,
            SaleRepository sales) {
        this.brands = brands;
        this.products = products;
        this.users = users;
        this.nfeEntries = nfeEntries;
        this.nfeItems = nfeItems;
        this.inventoryMovements = inventoryMovements;
        this.inventoryBalances = inventoryBalances;
        this.sales = sales;
    }

    @Transactional(readOnly = true)
    public List<BrandResponse> listBrands(long userId) {
        return brands.findByUser_IdOrderByNameAsc(userId).stream().map(BrandResponse::from).toList();
    }

    @Transactional
    public BrandResponse createBrand(long userId, BrandRequest request) {
        Optional<Brand> existing = brands.findByUser_IdAndNameIgnoreCase(userId, request.name().trim());
        if (existing.isPresent()) {
            return BrandResponse.from(existing.get());
        }
        Brand brand = new Brand();
        brand.setUser(users.getReferenceById(userId));
        brand.setName(request.name().trim());
        return BrandResponse.from(brands.save(brand));
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> listProducts(long userId) {
        return products.findByUser_IdOrderByNameAsc(userId).stream().map(ProductResponse::from).toList();
    }

    @Transactional
    public ProductResponse createProduct(long userId, ProductRequest request) {
        Product product = new Product();
        updateProductFields(userId, product, request);
        return ProductResponse.from(products.save(product));
    }

    @Transactional
    public ProductResponse updateProduct(long userId, long productId, ProductRequest request) {
        Product product =
                products.findByIdAndUser_Id(productId, userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        updateProductFields(userId, product, request);
        return ProductResponse.from(products.save(product));
    }

    @Transactional
    public NfeImportResponse importNfe(long userId, String rawXml) {
        ParsedNfe parsed = parseNfe(rawXml);
        User user = users.getReferenceById(userId);

        NfeEntry entry = new NfeEntry();
        entry.setUser(user);
        entry.setNfeNumber(parsed.number);
        entry.setSupplierName(parsed.supplierName);
        entry.setAccessKey(parsed.accessKey);
        entry.setRawXml(rawXml);
        entry = nfeEntries.save(entry);

        int importedItems = 0;
        for (ParsedNfeItem item : parsed.items) {
            Product product = products.findByUser_IdAndNameIgnoreCase(userId, item.description).orElseGet(() -> createFallbackProduct(user, item.description, item.unitCost));
            product.setCostPrice(item.unitCost);
            products.save(product);

            NfeItem nfeItem = new NfeItem();
            nfeItem.setNfeEntry(entry);
            nfeItem.setProduct(product);
            nfeItem.setDescription(item.description);
            nfeItem.setQuantity(item.quantity);
            nfeItem.setUnitCost(item.unitCost);
            nfeItem.setLineTotal(item.quantity.multiply(item.unitCost));
            nfeItems.save(nfeItem);

            registerStockMovement(user, product, "ENTRY", item.quantity, "NFE_IMPORT", entry.getId());
            importedItems++;
        }

        return new NfeImportResponse(entry.getId(), entry.getNfeNumber(), importedItems);
    }

    @Transactional
    public void adjustStock(long userId, StockAdjustmentRequest request) {
        Product product =
                products.findByIdAndUser_Id(request.productId(), userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        registerStockMovement(users.getReferenceById(userId), product, "ADJUSTMENT", request.quantity(), request.reason(), null);
    }

    @Transactional
    public void registerSale(long userId, SaleRequest request) {
        User user = users.getReferenceById(userId);
        Product product =
                products.findByIdAndUser_Id(request.productId(), userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Sale sale = new Sale();
        sale.setUser(user);
        sale.setProduct(product);
        sale.setQuantity(request.quantity());
        sale.setUnitPrice(request.unitPrice());
        sale.setUnitCost(request.unitCost());
        sales.save(sale);
        registerStockMovement(user, product, "SALE", request.quantity().negate(), "SALE_REGISTER", sale.getId());
    }

    @Transactional(readOnly = true)
    public List<LowStockResponse> listLowStock(long userId) {
        List<Product> userProducts = products.findByUser_IdOrderByNameAsc(userId);
        List<LowStockResponse> low = new ArrayList<>();
        for (Product product : userProducts) {
            BigDecimal current = inventoryBalances.findByUser_IdAndProduct_Id(userId, product.getId()).map(InventoryBalance::getQuantity).orElse(BigDecimal.ZERO);
            if (current.compareTo(product.getMinimumStock()) < 0) {
                low.add(new LowStockResponse(product.getId(), product.getName(), current, product.getMinimumStock()));
            }
        }
        return low;
    }

    @Transactional(readOnly = true)
    public BrandDashboardResponse brandDashboard(long userId, Instant from, Instant to) {
        List<Sale> periodSales = sales.findByUser_IdAndSoldAtBetween(userId, from, to);
        Map<String, BrandAccumulator> byBrand = new LinkedHashMap<>();
        for (Sale sale : periodSales) {
            String brandName = sale.getProduct().getBrand() == null ? FALLBACK_BRAND_NAME : sale.getProduct().getBrand().getName();
            BrandAccumulator acc = byBrand.computeIfAbsent(brandName, ignored -> new BrandAccumulator());
            BigDecimal qty = sale.getQuantity();
            BigDecimal revenue = sale.getUnitPrice().multiply(qty);
            BigDecimal cost = sale.getUnitCost().multiply(qty);
            acc.quantity = acc.quantity.add(qty);
            acc.revenue = acc.revenue.add(revenue);
            acc.profit = acc.profit.add(revenue.subtract(cost));
        }
        List<BrandKpiResponse> metrics =
                byBrand.entrySet().stream()
                        .map(entry -> toBrandKpi(entry.getKey(), entry.getValue()))
                        .sorted(Comparator.comparing(BrandKpiResponse::faturamento).reversed())
                        .toList();
        return new BrandDashboardResponse(from, to, metrics);
    }

    private BrandKpiResponse toBrandKpi(String brand, BrandAccumulator value) {
        BigDecimal margin =
                value.revenue.compareTo(BigDecimal.ZERO) == 0
                        ? BigDecimal.ZERO
                        : value.profit.multiply(new BigDecimal("100")).divide(value.revenue, 2, RoundingMode.HALF_UP);
        String giro = value.quantity.compareTo(new BigDecimal("100")) >= 0 ? "Alto" : value.quantity.compareTo(new BigDecimal("40")) >= 0 ? "Medio" : "Baixo";
        String insight =
                switch (giro) {
                    case "Baixo" -> "Marca com baixo giro, revisar compras.";
                    case "Alto" -> "Marca com alto giro, considerar reposicao.";
                    default -> "Marca em giro medio, monitorar margem.";
                };
        return new BrandKpiResponse(brand, value.revenue, value.profit, value.quantity, margin, giro, insight);
    }

    private Product createFallbackProduct(User user, String description, BigDecimal unitCost) {
        Product p = new Product();
        p.setUser(user);
        p.setName(description);
        p.setCostPrice(unitCost);
        p.setSalePrice(unitCost);
        p.setMinimumStock(BigDecimal.ZERO);
        return products.save(p);
    }

    private void updateProductFields(long userId, Product product, ProductRequest request) {
        product.setUser(users.getReferenceById(userId));
        product.setName(request.name().trim());
        product.setEan(request.ean());
        product.setNcm(request.ncm());
        product.setSku(request.sku());
        product.setCostPrice(request.costPrice());
        product.setSalePrice(request.salePrice());
        product.setMinimumStock(request.minimumStock());
        if (request.brandId() != null) {
            Brand brand =
                    brands.findByIdAndUser_Id(request.brandId(), userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            product.setBrand(brand);
        } else {
            product.setBrand(null);
        }
    }

    private void registerStockMovement(
            User user, Product product, String movementType, BigDecimal quantity, String source, Long sourceId) {
        InventoryMovement movement = new InventoryMovement();
        movement.setUser(user);
        movement.setProduct(product);
        movement.setMovementType(movementType);
        movement.setQuantity(quantity);
        movement.setSource(source);
        movement.setSourceId(sourceId);
        inventoryMovements.save(movement);

        InventoryBalance balance = inventoryBalances.findByUser_IdAndProduct_Id(user.getId(), product.getId()).orElseGet(() -> {
            InventoryBalance created = new InventoryBalance();
            created.setUser(user);
            created.setProduct(product);
            created.setQuantity(BigDecimal.ZERO);
            return created;
        });
        balance.setQuantity(balance.getQuantity().add(quantity));
        balance.setUpdatedAt(Instant.now());
        inventoryBalances.save(balance);
    }

    private ParsedNfe parseNfe(String rawXml) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(false);
            Document doc = factory.newDocumentBuilder().parse(new InputSource(new StringReader(rawXml)));
            String number = firstText(doc, "nNF", "0");
            String supplierName = firstText(doc, "xNome", "Fornecedor nao informado");
            String accessKey = firstText(doc, "chNFe", "");

            NodeList productsNodes = doc.getElementsByTagName("prod");
            List<ParsedNfeItem> items = new ArrayList<>();
            for (int i = 0; i < productsNodes.getLength(); i++) {
                org.w3c.dom.Node node = productsNodes.item(i);
                if (node.getNodeType() != org.w3c.dom.Node.ELEMENT_NODE) {
                    continue;
                }
                org.w3c.dom.Element prod = (org.w3c.dom.Element) node;
                String description = textFromElement(prod, "xProd", "Produto sem nome");
                BigDecimal qty = new BigDecimal(textFromElement(prod, "qCom", "0"));
                BigDecimal unitCost = new BigDecimal(textFromElement(prod, "vUnCom", "0"));
                items.add(new ParsedNfeItem(description, qty, unitCost));
            }
            return new ParsedNfe(number, supplierName, accessKey, items);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Falha ao ler XML da NFe", e);
        }
    }

    private String firstText(Document doc, String tag, String fallback) {
        NodeList nodes = doc.getElementsByTagName(tag);
        if (nodes.getLength() == 0 || nodes.item(0).getTextContent() == null || nodes.item(0).getTextContent().isBlank()) {
            return fallback;
        }
        return nodes.item(0).getTextContent().trim();
    }

    private String textFromElement(org.w3c.dom.Element element, String tag, String fallback) {
        NodeList nodes = element.getElementsByTagName(tag);
        if (nodes.getLength() == 0 || nodes.item(0).getTextContent() == null || nodes.item(0).getTextContent().isBlank()) {
            return fallback;
        }
        return nodes.item(0).getTextContent().trim();
    }

    private static class ParsedNfe {
        private final String number;
        private final String supplierName;
        private final String accessKey;
        private final List<ParsedNfeItem> items;

        private ParsedNfe(String number, String supplierName, String accessKey, List<ParsedNfeItem> items) {
            this.number = number;
            this.supplierName = supplierName;
            this.accessKey = accessKey;
            this.items = items;
        }
    }

    private static class ParsedNfeItem {
        private final String description;
        private final BigDecimal quantity;
        private final BigDecimal unitCost;

        private ParsedNfeItem(String description, BigDecimal quantity, BigDecimal unitCost) {
            this.description = description;
            this.quantity = quantity;
            this.unitCost = unitCost;
        }
    }

    private static class BrandAccumulator {
        private BigDecimal revenue = BigDecimal.ZERO;
        private BigDecimal profit = BigDecimal.ZERO;
        private BigDecimal quantity = BigDecimal.ZERO;
    }
}
