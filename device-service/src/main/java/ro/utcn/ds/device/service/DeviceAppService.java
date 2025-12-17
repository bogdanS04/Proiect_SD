package ro.utcn.ds.device.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.utcn.ds.device.dto.DeviceCreateRequest;
import ro.utcn.ds.device.dto.DeviceUpdateRequest;
import ro.utcn.ds.device.model.Device;
import ro.utcn.ds.device.repo.DeviceRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DeviceAppService {
    private final DeviceRepository repo;

    public List<Device> listAll(){ return repo.findAll(); }
    public List<Device> listMine(long authId){ return repo.findByUserAuthId(authId); }
    public Device get(long id){ return repo.findById(id).orElseThrow(); }

    @Transactional
    public Device createForUser(DeviceCreateRequest req){
        if (req.userAuthId()==null) throw new IllegalArgumentException("userAuthId is required");
        if (req.name()==null || req.name().isBlank()) throw new IllegalArgumentException("name is required");
        Device d = Device.builder()
                .userAuthId(req.userAuthId())
                .name(req.name())
                .description(req.description())
                .status(req.status()==null || req.status().isBlank()? "ACTIVE" : req.status())
                .build();
        return repo.save(d);
    }

    @Transactional
    public Device createMine(long authId, DeviceCreateRequest req){
        if (req.name()==null || req.name().isBlank()) throw new IllegalArgumentException("name is required");
        Device d = Device.builder()
                .userAuthId(authId)
                .name(req.name())
                .description(req.description())
                .status(req.status()==null || req.status().isBlank()? "ACTIVE" : req.status())
                .build();
        return repo.save(d);
    }

    @Transactional
    public Device update(long id, DeviceUpdateRequest req){
        Device d = get(id);
        if (req.name()!=null) d.setName(req.name());
        if (req.description()!=null) d.setDescription(req.description());
        if (req.status()!=null) d.setStatus(req.status());
        return repo.save(d);
    }

    @Transactional
    public void delete(long id){ repo.deleteById(id); }
}
