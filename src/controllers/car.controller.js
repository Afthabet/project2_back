// controllers/car.controller.js
const sharp = require('sharp');
const db = require("../models");
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const Car = db.Car;
const CarImage = db.CarImage;
const ActivityLog = db.ActivityLog;
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const parseFeatures = (featuresStr) => {
  if (!featuresStr || typeof featuresStr !== 'string') return [];
  return featuresStr.split(',').map(f => f.trim()).filter(Boolean);
};

// A helper function to safely parse integers
const safeParseInt = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
};

// A helper function to safely parse floats
const safeParseFloat = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
};


exports.create = async (req, res) => {
  const token = req.headers["x-access-token"];
  if (!token) return res.status(403).send({ message: "No token provided!" });

  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey123");
    userId = decoded.id;
  } catch (err) {
    return res.status(401).send({ message: "Unauthorized!" });
  }

  const carData = req.body;
  const files = req.files;


  if (!carData.name || !carData.price) {
    return res.status(400).send({ message: "Name and price are required." });
  }

  const transaction = await db.sequelize.transaction();
  try {
    const newCar = await Car.create({
      id: carData.id,
      make: carData.make || carData.name.split(' ')[0],
      model: carData.model || carData.name.split(' ').slice(1).join(' '),
      year: safeParseInt(carData.year),
      price: safeParseFloat(carData.price),
      mileage: safeParseInt(carData.mileage),
      description: carData.description,
      color: carData.color,
      engine: carData.engine,
      power: carData.power,
      transmission: carData.transmission,
      interiorColor: carData.interiorColor,
      bodyStyle: carData.bodyType,
      grade: carData.grade,
      features: parseFeatures(carData.features),
      isAvailable: true,
      owner_id: userId,
    }, { transaction });

    await ActivityLog.create({
        action_type: 'created',
        details: `Car '${newCar.make} ${newCar.model}' was created.`,
        car_id: newCar.id,
        user_id: userId
    }, { transaction });

    let firstImagePath = null;
    if (files && files.length > 0) {
      const imagePromises = files.map((file, index) => {
        const filename = `car-${Date.now()}-${uuidv4().slice(0, 6)}.webp`;
        const filepath = path.join(uploadDir, filename);
        const publicPath = `uploads/${filename}`;

        if (index === 0) {
          firstImagePath = publicPath;
        }

        return sharp(file.buffer)
          .resize({ width: 1280, fit: 'inside', withoutEnlargement: true })
          .toFormat('webp', { quality: 80 })
          .toFile(filepath)
          .then(() => {
            return CarImage.create({
              image: publicPath,
              order: index,
              car_id: newCar.id
            }, { transaction });
          });
      });
      await Promise.all(imagePromises);
    }

    if (firstImagePath) {
      newCar.thumbnail = firstImagePath;
      await newCar.save({ transaction });
    }


    await transaction.commit();
    res.status(201).send(newCar);
  } catch (error) {
    await transaction.rollback();
    res.status(500).send({ message: `Error creating car: ${error.message}` });
  }
};

exports.findAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort = 'trending',
      searchTerm,
      priceMin,
      priceMax,
      yearMin,
      yearMax,
      mileageMax,
      grades,
      bodyTypes,
      ownerId, // For admin dashboard
      status // For admin dashboard
    } = req.query;

    const offset = (page - 1) * limit;

    // --- Build Filter Clause ---
    const whereClause = {};
    if (status !== 'all') {
        whereClause.isAvailable = true;
    }

    if (ownerId) {
        whereClause.owner_id = ownerId;
    }

    if (searchTerm) {
        whereClause[Op.or] = [
            { make: { [Op.iLike]: `%${searchTerm}%` } },
            { model: { [Op.iLike]: `%${searchTerm}%` } }
        ];
    }

    if (priceMin && priceMax) whereClause.price = { [Op.between]: [priceMin, priceMax] };
    if (yearMin && yearMax) whereClause.year = { [Op.between]: [yearMin, yearMax] };
    if (mileageMax) whereClause.mileage = { [Op.lte]: mileageMax };
    if (grades) whereClause.grade = { [Op.in]: grades.split(',') };
    if (bodyTypes) whereClause.bodyStyle = { [Op.in]: bodyTypes.split(',') };

    // --- Build Sort Clause ---
    let orderClause = [['year', 'DESC']]; // Default to 'trending'
    if (sort === 'price-asc') orderClause = [['price', 'ASC']];
    if (sort === 'price-desc') orderClause = [['price', 'DESC']];
    if (sort === 'year-asc') orderClause = [['year', 'ASC']];

    const { count, rows: cars } = await Car.findAndCountAll({
      where: whereClause,
      include: [{ model: CarImage, as: 'images', order: [['order', 'ASC']] }],
      order: orderClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true // Important for correct count with joins
    });

    const formattedCars = cars.map(car => {
      const carJson = car.get({ plain: true });
      carJson.name = `${carJson.make || ''} ${carJson.model || ''}`.trim();
      if (!carJson.thumbnail && carJson.images && carJson.images.length > 0) {
        carJson.thumbnail = carJson.images[0].image;
      }
      carJson.status = carJson.isAvailable ? 'Available' : 'Sold';
      return carJson;
    });

    res.send({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      cars: formattedCars
    });

  } catch (err) {
    console.error("Error in findAll:", err);
    res.status(500).send({ message: "Error retrieving cars." });
  }
};

exports.findOne = async (req, res) => {
  const id = req.params.id;
  try {
    const car = await Car.findByPk(id, {
      include: [{ model: CarImage, as: 'images', order: [['order', 'ASC']] }]
    });

    if (car) {
      const carJson = car.get({ plain: true });
      carJson.name = `${carJson.make || ''} ${carJson.model || ''}`.trim();
      res.send(carJson);
    } else {
      res.status(404).send({ message: `Cannot find Car with id=${id}.` });
    }
  } catch (err) {
    console.error(`Error retrieving Car with id=${id}:`, err);
    res.status(500).send({ message: "Error retrieving Car with id=" + id });
  }
};

exports.update = async (req, res) => {
    const id = req.params.id;
    const token = req.headers["x-access-token"];
    if (!token) return res.status(403).send({ message: "No token provided!" });

    let userId;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey123");
        userId = decoded.id;
    } catch (err) {
        return res.status(401).send({ message: "Unauthorized!" });
    }

    const transaction = await db.sequelize.transaction();
    try {
        const car = await Car.findByPk(id, { transaction });
        if (!car) {
            await transaction.rollback();
            return res.status(404).send({ message: "Car not found." });
        }

        const nameParts = req.body.name ? req.body.name.split(' ') : [];
        const make = req.body.make || (nameParts.length > 0 ? nameParts[0] : car.make);
        const model = req.body.model || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : car.model);


        await car.update({
            make: make,
            model: model,
            year: safeParseInt(req.body.year),
            price: safeParseFloat(req.body.price),
            mileage: safeParseInt(req.body.mileage),
            description: req.body.description,
            color: req.body.color,
            engine: req.body.engine,
            power: req.body.power,
            transmission: req.body.transmission,
            interiorColor: req.body.interiorColor,
            bodyStyle: req.body.bodyType,
            grade: req.body.grade,
            features: parseFeatures(req.body.features),
        }, { transaction });

        await ActivityLog.create({
            action_type: 'updated',
            details: `Car '${car.make} ${car.model}' was updated.`,
            car_id: car.id,
            user_id: userId
        }, { transaction });

        const existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];
        const existingImageIds = existingImages.map(img => img.id);

        const imagesToDelete = await CarImage.findAll({ where: { car_id: id, id: { [db.Sequelize.Op.notIn]: existingImageIds } } });
        for (const img of imagesToDelete) {
            const filepath = path.join(__dirname, '..', '..', 'public', img.image);
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        }
        await CarImage.destroy({ where: { car_id: id, id: { [db.Sequelize.Op.notIn]: existingImageIds } }, transaction });

        for (let i = 0; i < existingImages.length; i++) {
            await CarImage.update({ order: i }, { where: { id: existingImages[i].id }, transaction });
        }

        let newThumbnailPath = existingImages.length > 0 ? existingImages[0].image : car.thumbnail;

        if (req.files && req.files.length > 0) {
            let currentOrder = existingImages.length;
            for (const file of req.files) {
                const filename = `car-${Date.now()}-${uuidv4().slice(0, 6)}.webp`;
                const filepath = path.join(uploadDir, filename);
                const publicPath = `uploads/${filename}`;

                await sharp(file.buffer)
                    .resize({ width: 1280, fit: 'inside', withoutEnlargement: true })
                    .toFormat('webp', { quality: 80 })
                    .toFile(filepath);

                await CarImage.create({ image: publicPath, order: currentOrder++, car_id: id }, { transaction });
            }
        }

        car.thumbnail = newThumbnailPath;
        await car.save({ transaction });

        await transaction.commit();
        const updatedCar = await Car.findByPk(id, { include: ["images"] });
        res.send(updatedCar);

    } catch (error) {
        await transaction.rollback();
        console.error("Update error:", error);
        res.status(500).send({ message: "Error updating car: " + error.message });
    }
};

exports.updateStatus = async (req, res) => {
    const id = req.params.id;
    const token = req.headers["x-access-token"];
    if (!token) return res.status(403).send({ message: "No token provided!" });

    let userId;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey123");
        userId = decoded.id;
    } catch (err) {
        return res.status(401).send({ message: "Unauthorized!" });
    }
    try {
        const car = await Car.findByPk(id);
        if (!car) {
            return res.status(404).send({ message: `Car with id=${id} not found.` });
        }
        await car.update({ isAvailable: !car.isAvailable });

        await ActivityLog.create({
            action_type: 'status_changed',
            details: `Car '${car.make} ${car.model}' availability set to ${car.isAvailable}.`,
            car_id: car.id,
            user_id: userId
        });
        res.send({ message: "Car status updated successfully." });
    } catch (error) {
        res.status(500).send({ message: "Error updating car status for id=" + id });
    }
};

exports.delete = async (req, res) => {
    const id = req.params.id;
    const token = req.headers["x-access-token"];
    if (!token) return res.status(403).send({ message: "No token provided!" });

    let userId;
    try {
        userId = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey123").id;
    } catch (err) {
        return res.status(401).send({ message: "Unauthorized!" });
    }

    const transaction = await db.sequelize.transaction();
    try {
        const car = await Car.findByPk(id, { transaction });
        if (!car) {
            await transaction.rollback();
            return res.status(404).send({ message: `Car with id=${id} not found.` });
        }

        // 1. Log the deletion action before doing anything else
        await ActivityLog.create({
            action_type: 'deleted',
            details: `Car '${car.make} ${car.model}' (ID: ${id}) was deleted.`,
            car_id: null, // Set to null as the car will be gone
            user_id: userId
        }, { transaction });

        // 2. Delete associated images from the filesystem
        const images = await CarImage.findAll({ where: { car_id: id }, transaction });
        for (const img of images) {
            const filepath = path.join(__dirname, '..', '..', 'public', img.image);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        }

        // 3. Delete image records from the database
        await CarImage.destroy({ where: { car_id: id }, transaction });

        // 4. Dissociate existing logs from the car to avoid foreign key errors
        await ActivityLog.update({ car_id: null }, { where: { car_id: id }, transaction });

        // 5. Finally, delete the car
        await Car.destroy({ where: { id: id }, transaction });

        await transaction.commit();
        res.send({ message: "Car was deleted successfully!" });
    } catch (error) {
        await transaction.rollback();
        console.error("Error deleting car:", error);
        res.status(500).send({ message: "Could not delete car with id=" + id });
    }
};